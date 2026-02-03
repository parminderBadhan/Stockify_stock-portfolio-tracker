const axios = require('axios');
const redis = require('../config/redis');
const PriceHistory = require('../models/PriceHistory');

class StockService {
  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.baseUrl = 'https://www.alphavantage.co/query';
    this.updateInterval = process.env.STOCK_UPDATE_INTERVAL || 30000;
  }

  async getStockPrice(symbol) {
    try {
      // Check cache first
      const cachedPrice = await redis.get(`stock:${symbol}`);
      if (cachedPrice) {
        return JSON.parse(cachedPrice);
      }

      // Fetch from Alpha Vantage
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: this.apiKey,
        },
        timeout: 5000,
      });

      const quoteData = response.data['Global Quote'];
      if (!quoteData || !quoteData['05. price']) {
        throw new Error(`Invalid response for symbol ${symbol}`);
      }

      const price = parseFloat(quoteData['05. price']);
      const volume = parseInt(quoteData['06. volume'] || 0);
      const change = parseFloat(quoteData['09. change'] || 0);
      const changePercent = parseFloat(quoteData['10. change percent'] || '0%');

      const priceData = {
        symbol,
        price,
        volume,
        change,
        changePercent: parseFloat(changePercent),
        timestamp: new Date(),
      };

      // Cache for 5 minutes
      await redis.setEx(`stock:${symbol}`, 300, JSON.stringify(priceData));

      // Save to database
      await PriceHistory.create(symbol, price, volume);

      return priceData;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error.message);
      
      // DEVELOPMENT FALLBACK: Return mock prices
      const mockPrices = {
        'AAPL': 245.50,
        'TSLA': 425.75,
        'GOOGL': 175.30,
        'MSFT': 420.10,
        'AMZN': 185.60,
        'META': 512.25,
      };
      
      const basePrice = mockPrices[symbol.toUpperCase()] || 100;
      // Add small random variation to simulate price changes
      const variation = (Math.random() - 0.5) * 5;
      const price = parseFloat((basePrice + variation).toFixed(2));
      
      const priceData = {
        symbol,
        price,
        volume: 1000000,
        change: variation,
        changePercent: parseFloat(((variation / basePrice) * 100).toFixed(2)),
        timestamp: new Date(),
        isMock: true,
      };
      
      console.log(`Using mock price for ${symbol}: $${price}`);
      
      // Cache mock price for 1 minute
      await redis.setEx(`stock:${symbol}`, 60, JSON.stringify(priceData));
      
      return priceData;
    }
  }

  async getMultiplePrices(symbols) {
    return Promise.all(symbols.map((symbol) => this.getStockPrice(symbol)));
  }

  async getPriceHistory(symbol, limit = 100) {
    try {
      return await PriceHistory.findBySymbol(symbol, limit);
    } catch (error) {
      console.error(`Error getting price history for ${symbol}:`, error.message);
      throw error;
    }
  }

  async getStockBeta(symbol) {
    // This would typically use historical data to calculate beta
    // For now, we'll use a simplified approach
    try {
      const cacheKey = `beta:${symbol}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // In production, calculate beta from historical returns
      // Beta is covariance(stock, market) / variance(market)
      // For demo, use mock data
      const beta = (Math.random() * 0.8 + 0.6).toFixed(2); // Beta between 0.6-1.4

      await redis.setEx(cacheKey, 86400, JSON.stringify(beta)); // Cache 24 hours

      return beta;
    } catch (error) {
      console.error(`Error calculating beta for ${symbol}:`, error.message);
      throw error;
    }
  }

  async startPriceUpdateLoop(symbols) {
    console.log(`Starting price update loop for ${symbols.length} symbols every ${this.updateInterval}ms`);

    const updatePrices = async () => {
      for (const symbol of symbols) {
        try {
          await this.getStockPrice(symbol);
          // Rate limit: wait between requests
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Failed to update price for ${symbol}:`, error.message);
        }
      }
    };

    // Initial update
    await updatePrices();

    // Subsequent updates
    setInterval(updatePrices, this.updateInterval);
  }
}

module.exports = new StockService();
