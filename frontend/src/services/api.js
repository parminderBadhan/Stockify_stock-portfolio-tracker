import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Portfolio endpoints
export const portfolioService = {
  getPortfolios: () => api.get('/portfolios'),
  createPortfolio: (name) => api.post('/portfolios', { name }),
  getPortfolio: (id) => api.get(`/portfolios/${id}`),
  getPortfolioAnalytics: (id) => api.get(`/portfolios/${id}/analytics`),
  updatePortfolio: (id, name) => api.put(`/portfolios/${id}`, { name }),
  deletePortfolio: (id) => api.delete(`/portfolios/${id}`),
};

// Holdings endpoints
export const holdingService = {
  addHolding: (portfolioId, symbol, quantity, purchasePrice) =>
    api.post('/holdings', { portfolioId, symbol, quantity, purchasePrice }),
  getHoldings: (portfolioId) => api.get(`/holdings/${portfolioId}`),
  updateHolding: (id, quantity, purchasePrice) =>
    api.put(`/holdings/${id}`, { quantity, purchasePrice }),
  deleteHolding: (id) => api.delete(`/holdings/${id}`),
};

// Stock endpoints
export const stockService = {
  getStockPrice: (symbol) => api.get(`/stocks/${symbol}`),
  getPriceHistory: (symbol, limit = 100) =>
    api.get(`/stocks/${symbol}/history`, { params: { limit } }),
  getPriceHistoryRange: (symbol, startDate, endDate) =>
    api.get(`/stocks/${symbol}/history/range`, {
      params: { startDate, endDate },
    }),
};

// Alert endpoints
export const alertService = {
  createAlert: (portfolioId, symbol, priceThreshold, condition, email) =>
    api.post('/alerts', { portfolioId, symbol, priceThreshold, condition, email }),
  getAlerts: (portfolioId) => api.get(`/alerts/${portfolioId}`),
  deactivateAlert: (id) => api.put(`/alerts/${id}/deactivate`),
  deleteAlert: (id) => api.delete(`/alerts/${id}`),
};

export default api;
