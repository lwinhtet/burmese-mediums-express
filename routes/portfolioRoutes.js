const express = require('express');
const {
  getAllPortfolios,
  getPortfolio
} = require('./../controllers/portfolioController');

const router = express.Router();

router.route('/').get(getAllPortfolios);

router.route('/:id').get(getPortfolio);

module.exports = router;
