require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const redis = require('./config/redis');
const StockService = require('./services/StockService');
const AlertService = require('./services/AlertService');

// Routes
const portfolioRoutes = require('./routes/portfolios');
const holdingRoutes = require('./routes/holdings');
const stockRoutes = require('./routes/stocks');
const alertRoutes = require('./routes/alerts');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// API Routes
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/holdings', holdingRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/alerts', alertRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server
let server;

const startServer = async () => {
  try {
    // Connect to Redis
    await redis.connect();
    console.log('Connected to Redis');

    // Start price update loop
    const defaultSymbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
    StockService.startPriceUpdateLoop(defaultSymbols);

    // Start alert monitoring
    AlertService.startMonitoring(60000); // Check every minute

    server = app.listen(PORT, () => {
      console.log(`Stock Portfolio Tracker API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  AlertService.stopMonitoring();

  if (server) {
    server.close(() => {
      console.log('Server closed');
      redis.quit(() => {
        console.log('Redis connection closed');
        process.exit(0);
      });
    });
  }
});

startServer();

module.exports = app;
