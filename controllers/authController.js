const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { promisify } = require('util');
const crypto = require('crypto');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const Email = require('../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  //Signing JWT
  // _id for payload, secret, jwt expire
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: 'Lax',
    path: '/'
    // secure: true
  };
  // only be send in encrypted connection if in production
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  // if (req.secure) cookieOptions.secure = true;
  res.cookie('accessToken', token, cookieOptions);

  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    userType: req.body.userType
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  // we prepared correctPassword method on user model instance
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('accessToken', 'logged-out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    status: 'success'
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401)
    );
  }

  // value of the promise is the decoded payload from JWT
  // checking user payload is manipulated or not
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  /* we could have stop here but what if user was deleted after tissued the token or
  user has changed his pw, we dont want to log them in so we continue to check for more security */
  // checking user still exist
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist!',
        401
      )
    );
  }

  // check user changed his pw after token was tissued
  // iat is when token issue at
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again', 401)
    );
  }

  req.user = freshUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    if (!token) {
      return next(
        new AppError('You are not logged in! Please log in to get access', 401)
      );
    }

    // 1) verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 2) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError(
          'The user belonging to this token does no longer exist!',
          401
        )
      );
    }

    // 3) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError('User recently changed password! Please log in again', 401)
      );
    }

    return res.status(200).json({
      status: 'success',
      // token: token,
      data: {
        user: currentUser
      }
    });
  } catch (error) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401)
    );
  }
};

exports.authz = (...userTypes) => {
  // userTypes -> ['admin', 'superadmin']
  return (req, res, next) => {
    if (!userTypes.includes(req.user.userType)) {
      return next(
        new AppError('You dont have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.updateMyPassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();
  createSendToken(user, 200, res);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    email: req.body.email,
    googleID: { $exists: false }
  });

  if (!user) {
    return next(new AppError('There is no user with this email', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({
    validateBeforeSave: false
  });

  // const resetURL = `${req.protocol}://${req.get(
  //   'host'
  // )}/api/v1/users/resetPassword/${resetToken}`;
  let protocol = 'http';
  let hostname = `${process.env.F_HOSTNAME}:${process.env.F_PORT}`;

  if (process.env.NODE_ENV === 'production') {
    protocol = 'https';
    hostname = process.env.F_HOSTNAME_PROD;
  }

  const resetURL = `${protocol}://${hostname}/account/reset-password?token=${resetToken}`;
  console.log(resetURL);
  try {
    // sendEmail is from ../utils/email.js
    //
    await new Email(user, resetURL).sendResetPassword();
    // await sendEmail(
    //   {
    //     name: user.name,
    //     email: user.email
    //   },
    //   resetURL
    // );
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({
      validateBeforeSave: false
    });
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

/*
  Get user based on the token
  If token has not expired and there is user, set the pw and other necessary data
  Update changedPasswordAt for the user
  Log the user in, send JWT
*/
exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res);
});

// Google Auth - both sign in & sign up
exports.googleAuth = catchAsync(async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return next(new AppError('Bad request!', 400));
  }

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const response = ticket.getPayload();

  if (
    response.iss !== 'accounts.google.com' &&
    response.aud !== process.env.GOOGLE_CLIENT_ID
  ) {
    return next(new AppError('Bad Request!', 400));
  }

  let status = 200;
  // 'Sub' is the unique ID of the user's Google Account
  let user = await User.findOne({
    $or: [{ email: response.email }, { googleID: response.sub }]
  });

  if (!user) {
    user = new User({
      // name: response.given_name.concat(' ', response.family_name),
      name: response.email.split('@')[0],
      email: response.email,
      googleID: response.sub,
      photo: response.picture
    });

    await user.save({
      validateBeforeSave: false
    });
    status = 201;
  } else {
    // eslint-disable-next-line no-lonely-if
    if (response.picture && !user.photo.startsWith('user-')) {
      user.photo = response.picture;
      await user.save({
        validateBeforeSave: false
      });
    }
  }

  createSendToken(user, status, res);
});
