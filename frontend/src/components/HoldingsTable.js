import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  CircularProgress,
  Box,
  IconButton,
  Dialog,
  TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { holdingService, portfolioService } from '../services/api';
import { formatCurrency, formatPercent, getPnLColor } from '../utils/formatters';
import PortfolioForm from './PortfolioForm';

const HoldingsTable = ({ portfolioId, onRefresh }) => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  useEffect(() => {
    loadPortfolio();
    const interval = setInterval(loadPortfolio, 30000);
    return () => clearInterval(interval);
  }, [portfolioId]);

  const loadPortfolio = async () => {
    try {
      const response = await portfolioService.getPortfolio(portfolioId);
      setPortfolio(response.data);
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await holdingService.deleteHolding(id);
        loadPortfolio();
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error('Error deleting holding:', error);
      }
    }
  };

  const handleEdit = (holding) => {
    setEditingId(holding.id);
    setEditValues({ quantity: holding.quantity, purchasePrice: holding.purchase_price });
  };

  const handleSaveEdit = async () => {
    try {
      await holdingService.updateHolding(editingId, editValues.quantity, editValues.purchasePrice);
      setEditingId(null);
      loadPortfolio();
    } catch (error) {
      console.error('Error updating holding:', error);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (!portfolio) {
    return <Typography>No portfolio data</Typography>;
  }

  return (
    <>
      <PortfolioForm portfolioId={portfolioId} onSuccess={loadPortfolio} />

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Holdings
          </Typography>

          {portfolio.holdings && portfolio.holdings.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#000000' }}>
                    <TableCell sx={{ color: 'common.white' }}>Symbol</TableCell>
                    <TableCell align="right" sx={{ color: 'common.white' }}>Quantity</TableCell>
                    <TableCell align="right" sx={{ color: 'common.white' }}>Purchase Price</TableCell>
                    <TableCell align="right" sx={{ color: 'common.white' }}>Current Price</TableCell>
                    <TableCell align="right" sx={{ color: 'common.white' }}>Cost Basis</TableCell>
                    <TableCell align="right" sx={{ color: 'common.white' }}>Current Value</TableCell>
                    <TableCell align="right" sx={{ color: 'common.white' }}>P&L</TableCell>
                    <TableCell align="right" sx={{ color: 'common.white' }}>Allocation %</TableCell>
                    <TableCell align="center" sx={{ color: 'common.white' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {portfolio.holdings.map((holding) => (
                    <TableRow key={holding.id} sx={{ bgcolor: holding.priceError ? 'warning.lighter' : 'inherit' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        {holding.symbol}
                        {holding.priceError && (
                          <Typography variant="caption" color="warning.main" display="block">
                            (Price unavailable)
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{parseFloat(holding.quantity).toFixed(2)}</TableCell>
                      <TableCell align="right">{formatCurrency(parseFloat(holding.purchase_price))}</TableCell>
                      <TableCell align="right">
                        {holding.currentPrice !== null ? formatCurrency(holding.currentPrice) : 'N/A'}
                      </TableCell>
                      <TableCell align="right">{formatCurrency(holding.costBasis || 0)}</TableCell>
                      <TableCell align="right">
                        {holding.currentValue !== null ? formatCurrency(holding.currentValue) : 'N/A'}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: holding.pnl !== null ? getPnLColor(holding.pnl) : 'text.secondary', fontWeight: 'bold' }}
                      >
                        {holding.pnl !== null ? (
                          <>
                            {formatCurrency(holding.pnl)}{' '}
                            <Typography variant="caption">
                              ({formatPercent(holding.pnlPercent || 0)})
                            </Typography>
                          </>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell align="right">
                        {holding.allocation !== null ? formatPercent(holding.allocation) : 'N/A'}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleEdit(holding)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(holding.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="textSecondary">No holdings yet</Typography>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editingId !== null} onClose={() => setEditingId(null)}>
        <Box sx={{ p: 3, minWidth: 300 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Edit Holding
          </Typography>
          <TextField
            fullWidth
            label="Quantity"
            type="number"
            value={editValues.quantity || ''}
            onChange={(e) => setEditValues({ ...editValues, quantity: parseFloat(e.target.value) })}
            sx={{ mb: 2 }}
            inputProps={{ step: '0.01' }}
          />
          <TextField
            fullWidth
            label="Purchase Price"
            type="number"
            value={editValues.purchasePrice || ''}
            onChange={(e) => setEditValues({ ...editValues, purchasePrice: parseFloat(e.target.value) })}
            sx={{ mb: 2 }}
            inputProps={{ step: '0.01' }}
          />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={() => setEditingId(null)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveEdit}>
              Save
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
};

export default HoldingsTable;
