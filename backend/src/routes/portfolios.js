const express = require('express');
const router = express.Router();
const PortfolioController = require('../controllers/PortfolioController');

router.post('/', PortfolioController.createPortfolio);
router.get('/', PortfolioController.getPortfolios);
router.get('/:id', PortfolioController.getPortfolio);
router.get('/:id/analytics', PortfolioController.getPortfolioWithAnalytics);
router.put('/:id', PortfolioController.updatePortfolio);
router.delete('/:id', PortfolioController.deletePortfolio);

module.exports = router;
