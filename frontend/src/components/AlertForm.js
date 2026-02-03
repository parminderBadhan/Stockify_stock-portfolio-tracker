import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  InputAdornment,
} from '@mui/material';
import { alertService } from '../services/api';

const AlertForm = ({ portfolioId, onAlertCreated }) => {
  const [formData, setFormData] = useState({
    symbol: '',
    priceThreshold: '',
    condition: 'above',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.symbol.trim()) {
      setError('Stock symbol is required');
      return;
    }
    if (!formData.priceThreshold || formData.priceThreshold <= 0) {
      setError('Valid price threshold is required');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Valid email is required');
      return;
    }

    try {
      setLoading(true);
      await alertService.createAlert(
        portfolioId,
        formData.symbol.toUpperCase(),
        parseFloat(formData.priceThreshold),
        formData.condition,
        formData.email
      );
      
      setSuccess(`Alert created! You'll be notified when ${formData.symbol.toUpperCase()} goes ${formData.condition} $${formData.priceThreshold}`);
      
      // Reset form
      setFormData({
        symbol: '',
        priceThreshold: '',
        condition: 'above',
        email: '',
      });

      // Notify parent component
      if (onAlertCreated) {
        onAlertCreated();
      }

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error creating alert:', err);
      setError(err.response?.data?.error || 'Failed to create alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Create Price Alert
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Get notified via email when a stock hits your target price
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Stock Symbol"
            name="symbol"
            value={formData.symbol}
            onChange={handleChange}
            placeholder="AAPL"
            sx={{ mb: 2 }}
            required
            inputProps={{ style: { textTransform: 'uppercase' } }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Condition</InputLabel>
            <Select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              label="Condition"
            >
              <MenuItem value="above">Price goes above</MenuItem>
              <MenuItem value="below">Price goes below</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Price Threshold"
            name="priceThreshold"
            type="number"
            value={formData.priceThreshold}
            onChange={handleChange}
            placeholder="180.00"
            sx={{ mb: 2 }}
            required
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{
              step: '0.01',
              min: '0',
            }}
          />

          <TextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            sx={{ mb: 2 }}
            required
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Alert'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AlertForm;
