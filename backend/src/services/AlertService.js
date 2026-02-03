const nodemailer = require('nodemailer');
const Alert = require('../models/Alert');
const StockService = require('./StockService');

class AlertService {
  constructor() {
    this.transporter = require('../config/email');
    this.isMonitoring = false;
  }

  async sendAlert(alert, currentPrice) {
    try {
      const message = `
        <h2>Price Alert Triggered!</h2>
        <p><strong>Stock Symbol:</strong> ${alert.symbol}</p>
        <p><strong>Current Price:</strong> $${currentPrice.toFixed(2)}</p>
        <p><strong>Threshold:</strong> ${alert.condition} $${alert.price_threshold.toFixed(2)}</p>
        <p><strong>Triggered at:</strong> ${new Date().toLocaleString()}</p>
      `;

      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: alert.email,
        subject: `Price Alert: ${alert.symbol} ${alert.condition} $${alert.price_threshold}`,
        html: message,
      });

      console.log(`Alert sent to ${alert.email} for ${alert.symbol}`);
    } catch (error) {
      console.error('Error sending alert email:', error.message);
    }
  }

  async checkAlerts() {
    try {
      const activeAlerts = await Alert.findActive();

      if (activeAlerts.length === 0) {
        return;
      }

      // Group by symbol to minimize API calls
      const alertsBySymbol = {};
      activeAlerts.forEach((alert) => {
        if (!alertsBySymbol[alert.symbol]) {
          alertsBySymbol[alert.symbol] = [];
        }
        alertsBySymbol[alert.symbol].push(alert);
      });

      // Check each symbol
      for (const [symbol, alerts] of Object.entries(alertsBySymbol)) {
        try {
          const stockData = await StockService.getStockPrice(symbol);
          const currentPrice = stockData.price;

          // Check each alert for this symbol
          for (const alert of alerts) {
            const conditionMet =
              (alert.condition === 'above' && currentPrice > alert.price_threshold) ||
              (alert.condition === 'below' && currentPrice < alert.price_threshold);

            if (conditionMet) {
              await this.sendAlert(alert, currentPrice);
              // Deactivate alert after sending (optional)
              // await Alert.deactivate(alert.id);
            }
          }
        } catch (error) {
          console.error(`Error checking alerts for ${symbol}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Error in alert check:', error.message);
    }
  }

  startMonitoring(intervalMs = 60000) {
    if (this.isMonitoring) {
      console.warn('Alert monitoring already running');
      return;
    }

    this.isMonitoring = true;
    console.log(`Starting alert monitoring every ${intervalMs}ms`);

    // Check immediately
    this.checkAlerts();

    // Then check at intervals
    this.monitoringInterval = setInterval(() => this.checkAlerts(), intervalMs);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.isMonitoring = false;
      console.log('Alert monitoring stopped');
    }
  }
}

module.exports = new AlertService();
