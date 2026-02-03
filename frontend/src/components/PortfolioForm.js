import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Box, TextField, Button, Card, CardContent, Typography, Alert } from '@mui/material';
import { holdingService } from '../services/api';

const validationSchema = Yup.object({
  symbol: Yup.string().required('Symbol is required').max(10),
  quantity: Yup.number().required('Quantity is required').positive('Quantity must be positive'),
  purchasePrice: Yup.number().required('Purchase price is required').positive('Price must be positive'),
});

const PortfolioForm = ({ portfolioId, onSuccess }) => {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setError(null);
      await holdingService.addHolding(portfolioId, values.symbol, values.quantity, values.purchasePrice);
      resetForm();
      setSuccess(`${values.symbol} added successfully!`);
      setTimeout(() => setSuccess(null), 3000);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding holding:', error);
      setError(error.response?.data?.error || error.message || 'Failed to add stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Add Stock to Portfolio
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
        <Formik
          initialValues={{ symbol: '', quantity: '', purchasePrice: '' }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting, values, handleChange, handleBlur }) => (
            <Form>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 2 }}>
                <TextField
                  name="symbol"
                  label="Symbol"
                  value={values.symbol}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.symbol && !!errors.symbol}
                  helperText={touched.symbol && errors.symbol}
                  placeholder="AAPL"
                />
                <TextField
                  name="quantity"
                  label="Quantity"
                  type="number"
                  value={values.quantity}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.quantity && !!errors.quantity}
                  helperText={touched.quantity && errors.quantity}
                  inputProps={{ step: '0.01' }}
                />
                <TextField
                  name="purchasePrice"
                  label="Purchase Price"
                  type="number"
                  value={values.purchasePrice}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.purchasePrice && !!errors.purchasePrice}
                  helperText={touched.purchasePrice && errors.purchasePrice}
                  inputProps={{ step: '0.01' }}
                />
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  Add
                </Button>
              </Box>
            </Form>
          )}
        </Formik>
      </CardContent>
    </Card>
  );
};

export default PortfolioForm;
