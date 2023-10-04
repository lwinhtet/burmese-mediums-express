const mongoose = require('mongoose');
/* on express, many packages depend on a special variable called NODE_ENV.
However express does not really define this variable, we have to do it manually.
We need to read env variables from config.env before we require the app
*/

/* UnhandledRejection are errors for async & UncaughtException are for sync.
In UnhandledRejection, crashing the app is optional but when there is an UncaughtException
we really need to crash out app bec after there was an UncaughtException, the entire node
process is in so-called 'un-clean' state. To fix that process need to terminate and to be restarted.
*/
/* UncaughtException are errors(bugs) that occur in our sync code but are not handled anywhere.
This code should be at the very top of our code (bec it is sync)
Central place to handle all sync code error for safty net(but we should not relay on this, 
we should catch error where error occur) */
process.on('uncaughtException', err => {
  console.log('Unhandled Exception!, 💥 Shutting down');
  console.log(err.name, err.message);
  // just directly shut down bec uncaughtException are not gonna happen async
  process.exit(1);
});

const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

const app = require('./app');

/* 
In native MongoDB driver, the MongoDB connection is live within the scope of the MongoClient.connect() 
callback function, and you can use it to perform database operations until you explicitly close the 
connection using client.close().
But in mongoose, the popular MongoDB object modeling library for Node.js, the connection to the MongoDB server is 
established differently from the native MongoDB driver. Mongoose provides a more declarative and 
modular way to manage the database connection.
With Mongoose, the connection to MongoDB is established only once when you call
mongoose.connect(). Once connected, the connection remains active and is automatically
managed by Mongoose. You don't need to explicitly manage the connection as you do with
the native MongoDB driver.
The connection remains live throughout the lifetime of your application. Mongoose handles
reconnections and connection errors behind the scenes, ensuring that you can perform database
operations seamlessly without worrying about managing the connection manually. 
*/
// {} is for dealing with some deprecation warning
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log('DB connection successfull!'));

// global environment set by express (app.get('env');)

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  // this cb will run as soon as server start listening
  console.log(`App running on port ${port}..`);
});

/* 
Central place to handle all promise/async rejection(unhandledRejection) for safty net 
(but we should not relay on this, we should catch error where error occur)
Each time that there is an unhandledRejection somewhere in our app, process obj 
will emit an obj called unhandledRejection and so we can subscribe */
process.on('unhandledRejection', err => {
  console.log('Unhandled Rejection!, 💥 Shutting down');
  console.log(11, err.name, err.message);

  // do doing server.close, we give the server basically time to finish all req that are still
  // pending or being handled at the time, then it will close
  server.close(() => {
    // shut down the app
    process.exit(1);
    // 0 for success
    // 1 for uncaught exception
  });
});
