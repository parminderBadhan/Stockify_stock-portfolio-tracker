const Holding = require('../models/Holding');
const RiskService = require('../services/RiskService');

class HoldingController {
  async addHolding(req, res) {
    try {
      const { portfolioId, symbol, quantity, purchasePrice } = req.body;

      if (!portfolioId || !symbol || !quantity || !purchasePrice) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const holding = await Holding.create(portfolioId, symbol, quantity, purchasePrice);
      res.status(201).json(holding);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getHoldings(req, res) {
    try {
      const { portfolioId } = req.params;
      const holdings = await Holding.findByPortfolioId(portfolioId);
      res.json(holdings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateHolding(req, res) {
    try {
      const { id } = req.params;
      const { quantity, purchasePrice } = req.body;

      const holding = await Holding.update(id, quantity, purchasePrice);
      res.json(holding);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteHolding(req, res) {
    try {
      const { id } = req.params;
      await Holding.delete(id);
      res.json({ message: 'Holding deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new HoldingController();
