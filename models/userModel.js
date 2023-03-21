const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const slugify = require('slugify');
// const { revalidatePortfolioPage } = require('../utils/revalidateSSG');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name!'],
      unique: [true, `{{Value}} is already taken! Please provide another name!`]
    },
    slug: String,
    email: {
      type: String,
      required: [true, 'Please provide your email!'],
      unique: [true, 'There is already a user with this email!'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Please provide a password!'],
      minlength: 6,
      select: false
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password!'],
      validate: {
        // only works on SAVE/CREATE!!! so use save on update too.
        validator: function(el) {
          return el === this.password;
        },
        message: 'Please confirm your password correctly!'
      }
    },
    passwordChangedAt: {
      type: Date,
      select: false
    },
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      select: false
    },
    googleID: String,
    termAgreed: {
      type: Boolean
    },
    profession: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    },
    about: {
      type: String,
      trim: true
    },
    userType: {
      type: String,
      default: 'user',
      enum: ['user', 'admin'],
      select: false
    },
    active: {
      type: Boolean,
      default: true,
      select: false
    },
    photo: {
      type: String
    },
    coverPhoto: String
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

userSchema.virtual('artworks', {
  ref: 'Artwork',
  foreignField: 'user',
  localField: '_id'
});

userSchema.pre(/^find/, function(next) {
  // 'this' point to query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

userSchema.pre('save', async function(next) {
  // only run this function if pw is only modified
  // isModified is method for document
  if (!this.isModified('password')) return next();

  /* bcrypt algorithm will first salt then hash our pw to make it strong to prevent from
  bruteforce attacks */
  /* salting means bcrypt gonna add random string to our pw so two equal pw(password === password)
  do not generate the same hash */
  // 12 is cost params, that is basically measure of CPU-intensive this op will be
  this.password = await bcrypt.hash(this.password, 12);
  // delete pwConfirm field (not to persisted in the db)
  // we set require in our model but it is only for input not for db.
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  /* Somtimes saving to db is a big slower than issuing the JWT the changed pw timestamp is sometimes
  set a bit after JWT has been created. Resuting passwordChangedAt is greater than token.ist
  that will make user will not be able to log in using the new token. So solve it by substracting 1s (1000) */
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// findByIdAndUpdate
// findByIdAndDelete
// revalidate ssg pages in update and delete for user (query middleware)
// userSchema.pre(/^findOneAnd/, async function(next) {
//   // a trick basiclly to pass data from pre to post instead of saving to variable
//   // we gonna save it to this.r
//   this.r = await this.findOne();
//   next();
// });

// userSchema.post(/^findOneAnd/, async function() {
//   // await this.findOne(); does not work here, query has already executed
//   // after user has been updated, now we can call revalidate func, we needed pre
//   // so that we can access recent doc bec we are in query middleware
//   // await this.r.constructor.calcAverageRatings(this.r.artwork);
//   revalidatePortfolioPage(this.r.slug);
// });

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  // this is instance method
  // we pass userPassword because we provided select:false in model
  // 'this' keyword will point to document
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    // dividing passwordChangedAt with 1000 to convert to second
    // 10 is base
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // is JWT is created with old pw?
    return JWTTimestamp < changedTimestamp; // 100 < 200
  }
  // false means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  // hashing the token to save in db. we should never save plain true value on db(like pw)
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
