const Alert = require('../models/Alert');
const Holding = require('../models/Holding');

class AlertController {
  async createAlert(req, res) {
    try {
      const { portfolioId, symbol, priceThreshold, condition, email } = req.body;

      if (!portfolioId || !symbol || !priceThreshold || !condition || !email) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (!['above', 'below'].includes(condition)) {
        return res.status(400).json({ error: 'Condition must be "above" or "below"' });
      }

      const alert = await Alert.create(portfolioId, symbol, priceThreshold, condition, email);
      res.status(201).json(alert);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAlerts(req, res) {
    try {
      const { portfolioId } = req.params;
      const alerts = await Alert.findByPortfolioId(portfolioId);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deactivateAlert(req, res) {
    try {
      const { id } = req.params;
      const alert = await Alert.deactivate(id);
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteAlert(req, res) {
    try {
      const { id } = req.params;
      await Alert.delete(id);
      res.json({ message: 'Alert deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AlertController();
