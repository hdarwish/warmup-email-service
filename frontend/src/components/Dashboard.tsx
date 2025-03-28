import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { emailAPI, authAPI } from '../services/api';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Card,
  CardContent,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import LogoutIcon from '@mui/icons-material/Logout';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';

interface EmailStats {
  totalSent: number;
  successRate: number;
  failedCount: number;
  recentActivity: {
    date: string;
    sent: number;
    failed: number;
  }[];
}

interface QuotaInfo {
  dailyQuota: number;
  remainingQuota: number;
  quotaResetTime: string;
  quotaUsage: {
    used: number;
    available: number;
    percentage: number;
  };
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [hasCredentials, setHasCredentials] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, quotaData, credentialsData] = await Promise.all([
        emailAPI.getEmailStats(),
        emailAPI.getQuotaInfo(),
        emailAPI.getEmailCredentials(),
      ]);
      setStats(statsData);
      setQuota(quotaData);
      setHasCredentials(credentialsData.length > 0);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLinkGmail = async () => {
    try {
      const response = await emailAPI.initiateGmailAuth();
      // Open in a new window instead of replacing current page
      window.open(response.url, '_blank');
    } catch (err) {
      setError('Failed to initiate Gmail authentication');
      console.error(err);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress) {
      setError('Please enter an email address');
      return;
    }

    try {
      setSendingTest(true);
      setError(null);
      setSuccess(null);
      
      console.log('Starting test email send to:', testEmailAddress);
      const response = await emailAPI.sendTestEmail(testEmailAddress);
      console.log('Test email response:', response);
      
      setSuccess('Test email sent successfully');
      setTestEmailAddress('');
      
      // Only fetch stats if the test was successful
      await fetchData();
    } catch (err) {
      console.error('Test email error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send test email';
      setError(errorMessage);
    } finally {
      setSendingTest(false);
    }
  };

  const handleUnlinkGmail = async () => {
    try {
      setError(null);
      setSuccess(null);
      await emailAPI.deleteGmailCredentials();
      setSuccess('Gmail account successfully unlinked');
      await fetchData(); // Refresh the data to update hasCredentials state
    } catch (err) {
      console.error('Failed to unlink Gmail:', err);
      setError('Failed to unlink Gmail account');
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4"  color="text.secondary">
          Email Warmup Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
  {!hasCredentials ? (
    <Button
      variant="contained"
      onClick={handleLinkGmail}
      startIcon={<LinkIcon />}
    >
      Link Gmail Account
    </Button>
  ) : (
    <Button
      variant="outlined"
      color="warning"
      onClick={handleUnlinkGmail}
      startIcon={<LinkOffIcon />}
    >
      Unlink Gmail Account
    </Button>
  )}
  <Button
    variant="outlined"
    color="error"
    onClick={handleLogout}
    startIcon={<LogoutIcon />}
  >
    Logout
  </Button>
</Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Stats Overview */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Email Statistics
            </Typography>
            {stats && (
              <>
                <Typography>Total Sent: {stats.totalSent}</Typography>
                <Typography>Success Rate: {stats.successRate.toFixed(1)}%</Typography>
                <Typography>Failed: {stats.failedCount}</Typography>
              </>
            )}
          </Paper>
        </Grid>

        {/* Quota Information */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quota Information
            </Typography>
            {quota && (
              <>
                <Typography>Daily Quota: {quota.dailyQuota}</Typography>
                <Typography>Remaining: {quota.remainingQuota}</Typography>
                <Typography>
                  Usage: {quota.quotaUsage.percentage.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Resets: {new Date(quota.quotaResetTime).toLocaleString()}
                </Typography>
              </>
            )}
          </Paper>
        </Grid>

        {/* Test Email Section */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Send Test Email
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  label="Recipient Email"
                  variant="outlined"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="Enter recipient email address"
                  error={!!error}
                  helperText={error}
                />
                <Button
                  variant="contained"
                  onClick={handleSendTestEmail}
                  disabled={sendingTest}
                  sx={{ minWidth: 120 }}
                >
                  {sendingTest ? <CircularProgress size={24} /> : 'Send Test'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Activity Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            {stats && stats.recentActivity.length > 0 ? (
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.recentActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="sent"
                      stroke="#8884d8"
                      name="Sent"
                    />
                    <Line
                      type="monotone"
                      dataKey="failed"
                      stroke="#ff7300"
                      name="Failed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Typography color="text.secondary">No recent activity</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}; 