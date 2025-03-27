import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Grid,
} from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Mock data for demonstration
  const emailStats = [
    { label: 'Total Emails Sent', value: '150' },
    { label: 'Success Rate', value: '98%' },
    { label: 'Daily Quota', value: '50/50' },
  ];

  const recentActivity = [
    { type: 'success', message: 'Email sent successfully to john@example.com' },
    { type: 'success', message: 'Email sent successfully to jane@example.com' },
    { type: 'error', message: 'Failed to send email to invalid@example.com' },
  ];

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4">
            Email Warmup Dashboard
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
          >
            Link Another Account
          </Button>
        </Box>

        <Grid container spacing={3}>
          {emailStats.map((stat) => (
            <Grid item xs={12} sm={4} key={stat.label}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  {stat.label}
                </Typography>
                <Typography variant="h4" color="primary">
                  {stat.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
          Recent Activity
        </Typography>

        <List>
          {recentActivity.map((activity, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                {activity.type === 'success' ? (
                  <CheckCircle color="success" />
                ) : (
                  <Error color="error" />
                )}
              </ListItemIcon>
              <ListItemText primary={activity.message} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  );
};

export default Dashboard; 