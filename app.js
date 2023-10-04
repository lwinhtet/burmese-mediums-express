const express = require('express');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const compression = require('compression');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const artworkRouter = require('./routes/artworkRoutes');
const userRouter = require('./routes/userRoutes');
const portfolioRouter = require('./routes/portfolioRoutes');

const reviewRouter = require('./routes/reviewRoutes');

/* app.js is usually mainly used for middleware declarations, So we have all our middleware
that we want to apply to all the routes */

const app = express();

// Set Security HTTP response headers for security
app.use(helmet());

// Implements Cors
// to add some headers to our responses 'Access-Control-Allow-Origin'
// if we set to * that means we enables to share our resourses(cors) to all sites
app.use(
  cors({
    // without it cors error happen when axios req is withCrendentials: true
    // but needed only for cross-site req from "http://127.0.0.1:3000"
    credentials: true,
    origin: 'http://127.0.0.1:3000'
  })
);
// .options is just another http Method that we can respond to like app.get, app.delete.
/* browser send an option req when there is a 'preflight phase'(preflight phase happen 
  whenever use request 'PUT','PATCH, DELETE, req that send cookie and req that use non-stadard headers'). 
  we need to respond back to that option req here */
// app.options('*', cors());
// only tours can be deleted from a cross-origin req, not users, artworks
// app.options('/api/v1/users/login', cors());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// connection rate limiter for Brute force attacks or DOS
// creating middleware function called 'limiter'
const limiter = rateLimit({
  // 100 req per hour(windowMs) for same IP
  max: 1000, // set to 100 @decrpted change max to limit
  windowMs: 60 * 60 * 1000, // length of the time window during which the max requests are allowed
  message: 'Too many requests from this IP, please try again in an hour!'
});
// only affect routes that starts with '/api'
app.use('/api', limiter);

// body parser, express does not put body data on req, so we do this
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// after parser data, we will sanitize our data here(middleware stack)

/* data sanitization against NoSQL query injection
it will look at req body, query string, param and filter out dollor sign and dots
that how mongodb operator works by removing them we sanitize our req */
app.use(mongoSanitize());

/* data sanitization against Cross site scripting (XSS)
This will clean malicious HTML code with js code attached to 
it later be injected into our html site. (eg. <div> -> &ltdiv) */
app.use(xss());

/* Prevent param pollution. (eg. sort=price&sort=rating) this will result an array 
['price', 'rating'] which is wrong. hpp will clear up query string and only use the 
last value (rating). We can also have whitlist for some value (duration=5&duration=9) */
app.use(
  hpp({
    whitelist: ['ratingsQuantity', 'ratingsAverage', 'price']
  })
);

// servering static files
app.use(express.static(path.join(__dirname, 'public')));

// compression
// compress all the text send to client, but not images only text
app.use(compression());

app.use((req, res, next) => {
  // convert nice readable string
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

/* We created these different routers for each of the resources to have nice separation 
of concern between these resources basically by creating sub app for each of them
and then putting everything in one main app file. */
/* We can use app.use in order to mount them */
/* Req goes into middleware stack and it match this '/api/v1/artworks' then
artworkRouter(our sub app that has its own route) will run. */
app.use('/api/v1/artworks', artworkRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/portfolios', portfolioRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  // if next() receive an argument, express will automatically know that there is an error
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// By specifying four params, express automatically know this is error handling middleware
app.use(globalErrorHandler);

module.exports = app;
