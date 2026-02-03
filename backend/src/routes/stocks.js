const express = require('express');
const router = express.Router();
const StockController = require('../controllers/StockController');

router.get('/:symbol', StockController.getStockPrice);
router.get('/:symbol/history', StockController.getPriceHistory);
router.get('/:symbol/history/range', StockController.getPriceHistoryRange);

module.exports = router;
