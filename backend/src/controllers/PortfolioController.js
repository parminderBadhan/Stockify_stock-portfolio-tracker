const Portfolio = require('../models/Portfolio');
const Holding = require('../models/Holding');
const RiskService = require('../services/RiskService');

class PortfolioController {
  async createPortfolio(req, res) {
    try {
      const { name } = req.body;
      const userId = 1; // Simplified - in production, get from auth token

      if (!name) {
        return res.status(400).json({ error: 'Portfolio name is required' });
      }

      const portfolio = await Portfolio.create(userId, name);
      res.status(201).json(portfolio);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPortfolios(req, res) {
    try {
      const userId = 1; // Simplified
      const portfolios = await Portfolio.findByUserId(userId);
      res.json(portfolios);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPortfolio(req, res) {
    try {
      const { id } = req.params;
      const portfolio = await Portfolio.findById(id);

      if (!portfolio) {
        return res.status(404).json({ error: 'Portfolio not found' });
      }

      const holdings = await Holding.findByPortfolioId(id);
      const portfolioValue = await RiskService.calculatePortfolioValue(holdings);

      res.json({
        ...portfolio,
        ...portfolioValue,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updatePortfolio(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const portfolio = await Portfolio.update(id, name);
      res.json(portfolio);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deletePortfolio(req, res) {
    try {
      const { id } = req.params;
      await Portfolio.delete(id);
      res.json({ message: 'Portfolio deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPortfolioWithAnalytics(req, res) {
    try {
      const { id } = req.params;
      const portfolio = await Portfolio.findById(id);

      if (!portfolio) {
        return res.status(404).json({ error: 'Portfolio not found' });
      }

      const holdings = await Holding.findByPortfolioId(id);
      const portfolioValue = await RiskService.calculatePortfolioValue(holdings);
      const beta = await RiskService.calculatePortfolioBeta(holdings);
      const var95 = await RiskService.calculateValueAtRisk(holdings);
      const sectors = await RiskService.analyzeSectorConcentration(holdings);

      res.json({
        ...portfolio,
        ...portfolioValue,
        beta,
        ...var95,
        sectors,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new PortfolioController();
