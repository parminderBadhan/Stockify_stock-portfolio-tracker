# Real-Time Stock Portfolio Tracker with Risk Analytics
A full-stack web application for tracking investment portfolios with real-time stock prices, P&L calculations, and comprehensive risk analytics.

## Features

- **Real-Time Price Updates**: Fetches live stock prices every 30 seconds via Alpha Vantage API
- **Portfolio Management**: Create and manage stock portfolios with holdings
- **P&L Tracking**: Real-time profit/loss and portfolio value calculations
- **Risk Analytics**:
  - Portfolio Beta calculation
  - Value at Risk (VaR) estimation
  - Sector concentration analysis
  - Allocation percentages
- **Price Alerts**: Email notifications when stocks hit user-defined price thresholds
- **Historical Performance**: Charts with 1D, 1W, 1M, 1Y views
- **Caching**: Redis-based caching for improved performance
- **Database**: PostgreSQL for persistent storage

## Tech Stack

### Frontend
- React with Hooks
- Chart.js for visualizations
- Axios for API calls
- Material-UI for components

### Backend
- Node.js/Express
- PostgreSQL database
- Redis cache
- Alpha Vantage API integration
- Nodemailer for email alerts

## Project Structure

```
stock-portfolio-tracker/
├── backend/          # Express API server
│   ├── src/
│   │   ├── server.js
│   │   ├── config/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── services/
│   │   └── middleware/
│   ├── package.json
│   └── .env.example
├── frontend/         # React application
│   ├── src/
│   │   ├── App.js
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── public/
└── docker-compose.yml
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis 7+
- Alpha Vantage API key (free tier available)

### Installation

1. Clone the repository
2. Create `.env` files in backend and frontend directories
3. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

4. Set up database:
   ```bash
   cd backend
   npm run migrate
   ```

5. Start services:
   ```bash
   # Terminal 1: Backend
   cd backend && npm start

   # Terminal 2: Frontend
   cd frontend && npm start
   ```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/stock_portfolio
REDIS_URL=redis://localhost:6379
ALPHA_VANTAGE_API_KEY=your_api_key
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
NODE_ENV=development
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## API Endpoints

### Portfolio Routes
- `GET /api/portfolios` - List all portfolios
- `POST /api/portfolios` - Create portfolio
- `GET /api/portfolios/:id` - Get portfolio details
- `PUT /api/portfolios/:id` - Update portfolio
- `DELETE /api/portfolios/:id` - Delete portfolio

### Holdings Routes
- `POST /api/holdings` - Add stock to portfolio
- `PUT /api/holdings/:id` - Update holding
- `DELETE /api/holdings/:id` - Remove holding

### Risk Routes
- `GET /api/risk/:portfolioId` - Get risk metrics
- `GET /api/risk/:portfolioId/var` - Calculate VaR
- `GET /api/risk/:portfolioId/beta` - Calculate portfolio beta

### Price Routes
- `GET /api/prices/:symbol` - Get latest stock price
- `GET /api/prices/:symbol/history` - Get price history

### Alert Routes
- `POST /api/alerts` - Create price alert
- `GET /api/alerts/:portfolioId` - List alerts
- `DELETE /api/alerts/:id` - Delete alert


## Key Calculations

### Portfolio Value
```
Total Value = Σ(quantity × current_price)
```

### P&L
```
P&L = Current Value - Total Cost Basis
P&L % = (P&L / Cost Basis) × 100
```

### Portfolio Beta
```
β_portfolio = Σ(weight_i × β_i)
where weight_i = value_i / total_portfolio_value
```

### Value at Risk (VaR) 95%
Uses historical variance method on portfolio returns over past periods.

## Performance Optimization

- Redis caches stock prices (5-minute TTL)
- Database indexes on symbol and user_id
- Connection pooling for PostgreSQL
- Batch updates for price history

## License

MIT

## Contributing

Contributions welcome! Please read contributing guidelines first.
