const express = require('express');
const {
  getAllArtworks,
  getArtwork,
  createArtwork,
  updateArtwork,
  deleteArtwork,
  aliasTopArtwork,
  getArtworkStats
} = require('../controllers/artworkController');
const { protect } = require('../controllers/authController');
const { setUserId } = require('../controllers/userController');
const reviewRouter = require('../routes/reviewRoutes');

// create express router middleware and then connect with our app
// this is called mounting a new router on route
const router = express.Router();

// param middleware
/* Our route handler dont have to worry about validation and they have only 
one purpose which is to do what they say (getArtwork, getUser) */
// this will check param named 'id'
// router.param('id', checkID);

router.route('/top-5-artworks').get(aliasTopArtwork, getAllArtworks);
router.route('/artwork-stats').get(getArtworkStats);
// do monthly upload

router
  .route('/')
  .get(getAllArtworks)
  .post(protect, setUserId, createArtwork);
// .post(protect, uploadPhotos, resizeImage, setUserId, createArtwork);

router
  .route('/:id')
  .get(getArtwork)
  .patch(protect, updateArtwork)
  .delete(protect, deleteArtwork);

// if url start with '/:artworkId/reviews' go to reviewRouter
/* By default, each router only have access to params of their spec routes.
But in '/:artworkId/reviews' route, artworkId is not available on reviewRouter.js.
We can solve this by mergeParams by express. */
router.use('/:artworkId/reviews', reviewRouter);

module.exports = router;
