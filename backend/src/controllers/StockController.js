const StockService = require('../services/StockService');
const PriceHistory = require('../models/PriceHistory');

class StockController {
  async getStockPrice(req, res) {
    try {
      const { symbol } = req.params;
      const priceData = await StockService.getStockPrice(symbol);
      res.json(priceData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPriceHistory(req, res) {
    try {
      const { symbol } = req.params;
      const { limit = 100 } = req.query;

      const history = await PriceHistory.findBySymbol(symbol, parseInt(limit));
      res.json({
        symbol,
        count: history.length,
        prices: history,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPriceHistoryRange(req, res) {
    try {
      const { symbol } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }

      const history = await PriceHistory.findBySymbolAndDateRange(
        symbol,
        new Date(startDate),
        new Date(endDate)
      );

      res.json({
        symbol,
        startDate,
        endDate,
        count: history.length,
        prices: history,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new StockController();
