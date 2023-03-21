const express = require('express');
const {
  signup,
  login,
  logout,
  protect,
  isLoggedIn,
  authz,
  forgotPassword,
  resetPassword,
  updateMyPassword,
  googleAuth
} = require('../controllers/authController');
const {
  getAllUsers,
  updateUser,
  deleteUser,
  getUser,
  getUserWithArtworks,
  updateMe,
  deleteMe,
  getMe
} = require('./../controllers/userController');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);
router.post('/isLoggedIn', isLoggedIn);

router.post('/google', googleAuth);

// protected routes
router.use(protect);
router.patch('/updateMyPassword', updateMyPassword);
router.get('/me', getMe, getUser);
router.patch('/updateMe', updateMe);
router.delete('/deleteMe', deleteMe);

// admin routes
router.use(authz('admin'));
router.route('/').get(getAllUsers);
router
  .route('/:id')
  .get(getUserWithArtworks)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;
