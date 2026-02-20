import React from 'react';
import { Card, CardContent, CardActionArea, Typography, Box, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { formatCurrency, getPnLColor } from '../utils/formatters';

const PortfolioCard = ({ portfolio, selected, onClick, onDelete, onEdit }) => {
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
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
            </Box>
            <Box>
              {onEdit && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  color="inherit"
                >
                  <EditIcon />
                </IconButton>
              )}
              {onDelete && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default PortfolioCard;
