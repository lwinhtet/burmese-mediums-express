const Review = require('../models/reviewModel');
const factory = require('../controllers/handlerFactory');

exports.setArtworkUserIds = (req, res, next) => {
  // allow nested routes
  if (!req.body.artwork) req.body.artwork = req.params.artworkId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReviews = factory.getAll(Review);

exports.getReview = factory.getOne(Review);

exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);
