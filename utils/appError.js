class AppError extends Error {
  constructor(message, statusCode) {
    // When we extends parent class(Error), we called super() in order to call parent constructor
    // and we pass 'message' bec it is the only param that Error class accept
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // all the errors created from this class will be operational error
    this.isOperational = true;

    /* We dont want this class to appear on the error stack track, 
    we only want to show where error really originated. This way when a 
    new obj is created and a constructor function is called then that function call
    is not gonna appear in the stack trace and will not pollute it. */
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
