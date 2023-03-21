const User = require('../models/userModel');
const factory = require('./../controllers/handlerFactory');

exports.getAllPortfolios = factory.getAll(User, {
  path: 'artworks',
  select: 'hashId thumbnailFile'
});

exports.getPortfolio = factory.getOne(
  User,
  {
    path: 'artworks',
    select: 'title hashId thumbnailFile'
  },
  'slug'
);
// res.status(200).json({
//   status: 'success',
//   user: { name: 'name' }
// });
