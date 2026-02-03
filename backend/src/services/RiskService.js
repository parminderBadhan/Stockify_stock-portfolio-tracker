const Holding = require('../models/Holding');
const StockService = require('./StockService');
const PriceHistory = require('../models/PriceHistory');
const redis = require('../config/redis');

class RiskService {
  /**
   * Calculate portfolio P&L and value
   */
  async calculatePortfolioValue(holdings) {
    if (!holdings || holdings.length === 0) {
      return {
        totalValue: 0,
        totalCostBasis: 0,
        totalPnL: 0,
        totalPnLPercent: 0,
        holdings: [],
      };
    }

    let totalValue = 0;
    let totalCostBasis = 0;
    const updatedHoldings = [];

    for (const holding of holdings) {
      const costBasis = parseFloat(holding.quantity) * parseFloat(holding.purchase_price);
      
      try {
        const currentPrice = await StockService.getStockPrice(holding.symbol);
        const currentValue = parseFloat(holding.quantity) * currentPrice.price;
        const pnl = currentValue - costBasis;
        const pnlPercent = (pnl / costBasis) * 100;

        updatedHoldings.push({
          ...holding,
          currentPrice: currentPrice.price,
          currentValue,
          costBasis,
          pnl,
          pnlPercent,
          allocation: 0, // Will be calculated after total is known
          priceError: false,
        });

        totalValue += currentValue;
        totalCostBasis += costBasis;
      } catch (error) {
        console.error(`Error calculating value for ${holding.symbol}:`, error.message);
        
        // Fallback: Show holding with cost basis but no current price
        updatedHoldings.push({
          ...holding,
          currentPrice: null,
          currentValue: null,
          costBasis,
          pnl: null,
          pnlPercent: null,
          allocation: 0,
          priceError: true,
          errorMessage: 'Price unavailable',
        });
        
        totalCostBasis += costBasis;
      }
    }

    // Calculate allocation percentages
    updatedHoldings.forEach((holding) => {
      holding.allocation = totalValue > 0 ? (holding.currentValue / totalValue) * 100 : 0;
    });

    const totalPnL = totalValue - totalCostBasis;
    const totalPnLPercent = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

    return {
      totalValue: parseFloat(totalValue.toFixed(2)),
      totalCostBasis: parseFloat(totalCostBasis.toFixed(2)),
      totalPnL: parseFloat(totalPnL.toFixed(2)),
      totalPnLPercent: parseFloat(totalPnLPercent.toFixed(2)),
      holdings: updatedHoldings,
    };
  }

  /**
   * Calculate portfolio beta (weighted average)
   */
  async calculatePortfolioBeta(holdings) {
    try {
      const cacheKey = 'portfolio:beta';
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      let totalBeta = 0;
      let totalValue = 0;

      const portfolioValue = await this.calculatePortfolioValue(holdings);

      for (const holding of portfolioValue.holdings) {
        const beta = await StockService.getStockBeta(holding.symbol);
        const weight = holding.currentValue / portfolioValue.totalValue;
        totalBeta += parseFloat(beta) * weight;
        totalValue += holding.currentValue;
      }

      const portfolioBeta = parseFloat(totalBeta.toFixed(2));

      // Cache for 24 hours
      await redis.setEx(cacheKey, 86400, JSON.stringify(portfolioBeta));

      return portfolioBeta;
    } catch (error) {
      console.error('Error calculating portfolio beta:', error.message);
      throw error;
    }
  }

  /**
   * Calculate Value at Risk (VaR) at 95% confidence level
   * Using historical variance method
   */
  async calculateValueAtRisk(holdings, confidenceLevel = 0.95) {
    try {
      const cacheKey = `portfolio:var:${confidenceLevel}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const portfolioValue = await this.calculatePortfolioValue(holdings);

      if (portfolioValue.totalValue === 0) {
        return {
          var95: 0,
          varPercent: 0,
        };
      }

      // Calculate returns variance from historical data
      let totalVariance = 0;
      let count = 0;

      for (const holding of holdings) {
        try {
          const priceHistory = await PriceHistory.findBySymbol(holding.symbol, 60);

          if (priceHistory.length > 1) {
            const returns = [];
            for (let i = 1; i < priceHistory.length; i++) {
              const dailyReturn = (priceHistory[i].price - priceHistory[i - 1].price) / priceHistory[i - 1].price;
              returns.push(dailyReturn);
            }

            if (returns.length > 0) {
              const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
              const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
              const weight = holding.quantity * (priceHistory[priceHistory.length - 1]?.price || 0) / portfolioValue.totalValue;

              totalVariance += variance * weight;
              count++;
            }
          }
        } catch (error) {
          console.error(`Error calculating VaR for ${holding.symbol}:`, error.message);
        }
      }

      // Standard deviation of portfolio
      const portfolioStdDev = Math.sqrt(totalVariance);

      // Z-score for 95% confidence (one-tailed)
      const zScore = 1.645;

      // VaR = Portfolio Value × Z-score × Std Dev
      const var95 = portfolioValue.totalValue * zScore * portfolioStdDev;
      const varPercent = (var95 / portfolioValue.totalValue) * 100;

      const result = {
        var95: parseFloat(var95.toFixed(2)),
        varPercent: parseFloat(varPercent.toFixed(2)),
      };

      // Cache for 24 hours
      await redis.setEx(cacheKey, 86400, JSON.stringify(result));

      return result;
    } catch (error) {
      console.error('Error calculating VaR:', error.message);
      throw error;
    }
  }

  /**
   * Analyze sector concentration
   */
  async analyzeSectorConcentration(holdings) {
    try {
      const cacheKey = 'portfolio:sectors';
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const sectorMap = {
        // Technology
        AAPL: 'Technology',
        MSFT: 'Technology',
        GOOGL: 'Technology',
        META: 'Technology',
        NVDA: 'Technology',
        // Finance
        JPM: 'Finance',
        BAC: 'Finance',
        GS: 'Finance',
        // Healthcare
        JNJ: 'Healthcare',
        UNH: 'Healthcare',
        PFE: 'Healthcare',
        // Consumer
        AMZN: 'Consumer',
        WMT: 'Consumer',
        KO: 'Consumer',
        // Energy
        XOM: 'Energy',
        CVX: 'Energy',
        // Industrial
        BA: 'Industrial',
        CAT: 'Industrial',
      };

      const portfolioValue = await this.calculatePortfolioValue(holdings);
      const sectorConcentration = {};

      portfolioValue.holdings.forEach((holding) => {
        const sector = sectorMap[holding.symbol] || 'Other';
        if (!sectorConcentration[sector]) {
          sectorConcentration[sector] = {
            value: 0,
            percent: 0,
            stocks: [],
          };
        }
        sectorConcentration[sector].value += holding.currentValue;
        sectorConcentration[sector].stocks.push(holding.symbol);
      });

      // Calculate percentages
      Object.keys(sectorConcentration).forEach((sector) => {
        sectorConcentration[sector].percent = parseFloat(
          ((sectorConcentration[sector].value / portfolioValue.totalValue) * 100).toFixed(2)
        );
      });

      // Cache for 24 hours
      await redis.setEx(cacheKey, 86400, JSON.stringify(sectorConcentration));

      return sectorConcentration;
    } catch (error) {
      console.error('Error analyzing sector concentration:', error.message);
      throw error;
    }
  }
}

module.exports = new RiskService();
