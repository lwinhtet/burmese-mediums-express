const AppError = require('../utils/appError');

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    // Operational error
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // Programmer error
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong! Try again Later.'
    });
  }
};

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const key = Object.keys(err.keyValue).at(0);
  const value = Object.values(err.keyValue).at(0);
  let message = `Duplicate field value: ${value}. Please use another value`;
  if (key === 'name')
    message = `${value} is already taken! Please provide another name!`;
  if (key === 'email')
    message = `This email already has an account associated with it!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid Token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again!', 401);

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // Un-notice error (like some mongoose error -> unvalid ObjectId)
    /* in development, we dont care about some unnoticed operational error to show in readable style
    But in production, we are transforming weird error that we were getting from Mongoose to readable 
    operational error. */
    let error = { ...err, name: err.name };
    error.message = err.message;
    // transfrom error to operational
    // CastError -> invalid ObjectId for mongoose
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    // MongoError -> caused by mongo, not from mongoose so we used code instead (duplicate field)
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError')
      error = handleJWTExpiredError(error);
    sendErrorProd(error, res);
  }
};
