const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Artwork = require('./../../models/artworkModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({ path: './config.env' });

/* We run this file to import or delete our data. Let interact with the cmd line
let run 'node dev-data/data/import-dev-data.js'. If we have console.log(process.argv) 
it will result an array of two arguments of running the node process from cmd. 
One for 'node' & one for 'import-dev-data.js'. That why we append something like '--import' 
or '--delete', we can commend some actions to operate. This is an cmd line application.
***** node dev-data/data/import-dev-data.js --import *****
***** process.argv ******
*/

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => {
    console.log('DB connection successful');
  });

// const artworks = JSON.parse(
//   fs.readFileSync(`${__dirname}/artworks.json`, 'utf-8')
// );
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
// const reviews = JSON.parse(
//   fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
// );

const importData = async () => {
  try {
    // await Artwork.create(artworks);
    await User.create(users, { validateBeforeSave: false });
    // await Review.create(reviews, { validateBeforeSave: false });
    console.log('Data successfully loaded!');
  } catch (error) {
    console.log(error);
  }
  /* This is kind of aggro way of stopping app, in this no problem bec it really just a
  a very small script */
  process.exit();
};

// importData();

const deleteData = async () => {
  try {
    await Artwork.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data deleted successfully');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
