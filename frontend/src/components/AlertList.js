import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { alertService } from '../services/api';

const AlertList = ({ portfolioId, refreshTrigger }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (portfolioId) {
      loadAlerts();
    }
  }, [portfolioId, refreshTrigger]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await alertService.getAlerts(portfolioId);
      setAlerts(response.data);
    } catch (err) {
      console.error('Error loading alerts:', err);
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (alertId) => {
    try {
      await alertService.deactivateAlert(alertId);
      loadAlerts();
    } catch (err) {
      console.error('Error deactivating alert:', err);
      setError('Failed to deactivate alert');
    }
  };

  const handleDelete = async (alertId) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      try {
        await alertService.deleteAlert(alertId);
        loadAlerts();
      } catch (err) {
        console.error('Error deleting alert:', err);
        setError('Failed to delete alert');
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <NotificationsActiveIcon sx={{ mr: 1 }} />
          <Typography variant="h6">
            Active Price Alerts
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {alerts.length === 0 ? (
          <Box textAlign="center" py={3}>
            <NotificationsOffIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No alerts set up yet
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Create an alert above to get notified of price changes
            </Typography>
          </Box>
        ) : (
          <List>
            {alerts.map((alert, index) => (
              <React.Fragment key={alert.id}>
                {index > 0 && <Divider />}
                <ListItem
                  secondaryAction={
                    <Box>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDelete(alert.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                  sx={{
                    opacity: alert.is_active ? 1 : 0.5,
                    bgcolor: alert.is_active ? 'transparent' : 'action.hover',
                  }}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={alert.symbol}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        {alert.condition === 'above' ? (
                          <TrendingUpIcon color="success" fontSize="small" />
                        ) : (
                          <TrendingDownIcon color="error" fontSize="small" />
                        )}
                        <Typography variant="body1">
                          {alert.condition === 'above' ? '≥' : '≤'} ${parseFloat(alert.price_threshold).toFixed(2)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box mt={0.5}>
                        <Typography variant="caption" display="block">
                          Email: {alert.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Created: {new Date(alert.created_at).toLocaleString()}
                        </Typography>
                        {!alert.is_active && (
                          <Chip
                            label="Inactive"
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertList;
