import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Grid, Box, CircularProgress } from '@mui/material';
import { portfolioService } from '../services/api';
import { formatCurrency, formatPercent, getPnLColor, getPnLTextColor } from '../utils/formatters';

const RiskMetrics = ({ portfolioId }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [portfolioId]);

  const loadMetrics = async () => {
    try {
      const response = await portfolioService.getPortfolioAnalytics(portfolioId);
      setMetrics(response.data);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (!metrics) {
    return <Typography>No data available</Typography>;
  }

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {/* Portfolio Value */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Portfolio Value
            </Typography>
            <Typography variant="h5">{formatCurrency(metrics.totalValue)}</Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* P&L */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total P&L
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Typography variant="h5" sx={{ color: getPnLColor(metrics.totalPnL) }}>
                {formatCurrency(metrics.totalPnL)}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: getPnLColor(metrics.totalPnLPercent) }}>
              {formatPercent(metrics.totalPnLPercent)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Portfolio Beta */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Portfolio Beta
            </Typography>
            <Typography variant="h5">{metrics.beta || 'N/A'}</Typography>
            <Typography variant="body2" color="textSecondary">
              (Market sensitivity)
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Value at Risk */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              VaR (95%)
            </Typography>
            <Typography variant="h5">{formatCurrency(metrics.var95 || 0)}</Typography>
            <Typography variant="body2" color="error">
              {formatPercent(metrics.varPercent || 0)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Sector Concentration */}
      {metrics.sectors && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sector Concentration
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(metrics.sectors).map(([sector, data]) => (
                  <Grid item xs={12} sm={6} md={4} key={sector}>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        {sector}
                      </Typography>
                      <Typography variant="body1">
                        {formatPercent(data.percent)} ({data.stocks.join(', ')})
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

export default RiskMetrics;
