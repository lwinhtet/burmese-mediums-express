const express = require('express');
const { protect, authz } = require('../controllers/authController');
const {
  getAllReviews,
  createReview,
  updateReview,
  deleteReview,
  setArtworkUserIds,
  getReview
} = require('../controllers/reviewController');

const router = express.Router({ mergeParams: true });

// protected routes
router.use(protect);
router
  .route('/')
  .get(getAllReviews)
  .post(authz('user'), setArtworkUserIds, createReview);

router
  .route('/:id')
  .get(getReview)
  .patch(authz('user'), updateReview)
  .delete(authz('user'), deleteReview);

module.exports = router;
