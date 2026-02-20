import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Button,
  Dialog,
  TextField,
  Alert,
} from '@mui/material';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { portfolioService, holdingService } from '../services/api';
import PortfolioForm from '../components/PortfolioForm';
import PortfolioCard from '../components/PortfolioCard';
import RiskMetrics from '../components/RiskMetrics';
import HoldingsTable from '../components/HoldingsTable';
import AlertForm from '../components/AlertForm';
import AlertList from '../components/AlertList';

const Dashboard = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewPortfolioDialog, setShowNewPortfolioDialog] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editPortfolioId, setEditPortfolioId] = useState(null);
  const [editPortfolioName, setEditPortfolioName] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [alertRefreshTrigger, setAlertRefreshTrigger] = useState(0);

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    try {
      setLoading(true);
      const response = await portfolioService.getPortfolios();

      // Try to enrich each portfolio with analytics (totals). Some backends
      // may return basic portfolios only, so call analytics per-portfolio.
      const basePortfolios = response.data || [];
      const enriched = await Promise.all(
        basePortfolios.map(async (p) => {
          try {
            const res = await portfolioService.getPortfolioAnalytics(p.id);
            return res.data;
          } catch (err) {
            try {
              const res2 = await portfolioService.getPortfolio(p.id);
              return res2.data;
            } catch (err2) {
              return p;
            }
          }
        })
      );

      setPortfolios(enriched);
      if (enriched.length > 0) {
        setSelectedPortfolio(enriched[0].id);
      }
    } catch (error) {
      console.error('Error loading portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePortfolio = async (id) => {
    if (!window.confirm('Are you sure you want to delete this portfolio?')) return;
    try {
      await portfolioService.deletePortfolio(id);
      setSuccess('Portfolio deleted');
      setTimeout(() => setSuccess(null), 3000);
      loadPortfolios();
    } catch (err) {
      console.error('Error deleting portfolio:', err);
      setError(err.response?.data?.error || err.message || 'Failed to delete portfolio');
    }
  };

  const handleCreatePortfolio = async () => {
    if (!newPortfolioName.trim()) {
      setError('Portfolio name is required');
      return;
    }
    
    try {
      setError(null);
      await portfolioService.createPortfolio(newPortfolioName);
      setNewPortfolioName('');
      setShowNewPortfolioDialog(false);
      setSuccess('Portfolio created successfully!');
      setTimeout(() => setSuccess(null), 3000);
      loadPortfolios();
    } catch (error) {
      console.error('Error creating portfolio:', error);
      setError(error.response?.data?.error || error.message || 'Failed to create portfolio');
    }
  };

  const handleRenameSubmit = async () => {
    if (!editPortfolioName || !editPortfolioName.trim()) {
      setError('Portfolio name is required');
      return;
    }

    try {
      setError(null);
      await portfolioService.updatePortfolio(editPortfolioId, editPortfolioName.trim());
      setShowEditDialog(false);
      setSuccess('Portfolio renamed');
      setTimeout(() => setSuccess(null), 3000);
      loadPortfolios();
    } catch (err) {
      console.error('Error renaming portfolio:', err);
      setError(err.response?.data?.error || err.message || 'Failed to rename portfolio');
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1">
          Stock Portfolio Tracker
        </Typography>
        <Button variant="contained" onClick={() => setShowNewPortfolioDialog(true)}>
          New Portfolio
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Portfolio List */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                Your Portfolios
              </Typography>
              {portfolios.map((portfolio) => (
                <PortfolioCard
                  key={portfolio.id}
                  portfolio={portfolio}
                  selected={selectedPortfolio === portfolio.id}
                  onClick={() => setSelectedPortfolio(portfolio.id)}
                  onDelete={() => handleDeletePortfolio(portfolio.id)}
                  onEdit={() => {
                    setEditPortfolioId(portfolio.id);
                    setEditPortfolioName(portfolio.name || '');
                    setShowEditDialog(true);
                  }}
                />
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Portfolio Details */}
        <Grid item xs={12} md={8}>
          {selectedPortfolio && portfolios.length > 0 && (
            <>
              <RiskMetrics portfolioId={selectedPortfolio} />
              <HoldingsTable portfolioId={selectedPortfolio} onRefresh={loadPortfolios} />
            </>
          )}
        </Grid>

        {/* Price Alerts Section */}
        {selectedPortfolio && portfolios.length > 0 && (
          <>
            <Grid item xs={12} md={6}>
              <AlertForm 
                portfolioId={selectedPortfolio}
                onAlertCreated={() => setAlertRefreshTrigger(prev => prev + 1)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <AlertList 
                portfolioId={selectedPortfolio}
                refreshTrigger={alertRefreshTrigger}
              />
            </Grid>
          </>
        )}
      </Grid>

      {/* New Portfolio Dialog */}
      <Dialog open={showNewPortfolioDialog} onClose={() => setShowNewPortfolioDialog(false)}>
        <Box sx={{ p: 3, minWidth: 400 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Create New Portfolio
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
          <TextField
            fullWidth
            label="Portfolio Name"
            value={newPortfolioName}
            onChange={(e) => setNewPortfolioName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreatePortfolio()}
            sx={{ mb: 2 }}
            autoFocus
          />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={() => setShowNewPortfolioDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreatePortfolio}>
              Create
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* Edit Portfolio Dialog */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)}>
        <Box sx={{ p: 3, minWidth: 400 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Rename Portfolio
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
          <TextField
            fullWidth
            label="Portfolio Name"
            value={editPortfolioName}
            onChange={(e) => setEditPortfolioName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleRenameSubmit()}
            sx={{ mb: 2 }}
            autoFocus
          />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => handleRenameSubmit()}>
              Save
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
