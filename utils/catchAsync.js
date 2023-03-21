/* We are passing async function to catchAsync to separate error handling and 
    to get rid of doing trycatch all the time. We can't run directly our passed async function
    in catchAsync bec createArtwork(main exported fucntion) is not the result of calling a function and 
    catchAsync has no way of knowing (req, res, next) value. So, We do the trick by returning another function 
    from catchAysnc, so become a function running another function. 
    Passed async function return a Promise and then if there is an error/rejected we catch the error
    using catch method. Error should of course be catched in catch method but it propagated to our global error
    handling middleware.
    */
module.exports = fn => {
  return (req, res, next) => {
    /* we need next() in order to pass the error into it, so that
     error can be handled in global error handler
     catch(err => next(err)) => catch(next)
     in js, we can simplify like this, we just have to pass the function (next) here
     and then be called automatically with the parameter with callback receive */
    fn(req, res, next).catch(next);
  };
};
