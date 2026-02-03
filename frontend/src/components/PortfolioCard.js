import React from 'react';
import { Card, CardContent, CardActionArea, Typography, Box } from '@mui/material';
import { formatCurrency, getPnLColor } from '../utils/formatters';

const PortfolioCard = ({ portfolio, selected, onClick }) => {
  return (
    <Card
      sx={{
        mb: 2,
        border: selected ? '2px solid #1976d2' : '1px solid #222222',
        cursor: 'pointer',
        backgroundColor: selected ? '#111111' : '#000000',
        color: 'common.white',
      }}
    >
      <CardActionArea onClick={onClick}>
        <CardContent>
          <Typography variant="h6" sx={{ color: 'common.white' }}>
            {portfolio.name}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Value: {formatCurrency(portfolio.totalValue || 0)}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: getPnLColor(portfolio.totalPnL || 0) }}
            >
              P&L: {formatCurrency(portfolio.totalPnL || 0)}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default PortfolioCard;
