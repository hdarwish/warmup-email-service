import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { emailAPI } from '../services/api';
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
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setHasToken(!!token);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, quotaData] = await Promise.all([
          emailAPI.getEmailStats(),
          emailAPI.getQuotaInfo(),
        ]);
        setStats(statsData);
        setQuota(quotaData);
      } catch (err) {
        setError('Failed to fetch dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLinkGmail = async () => {
    try {
      const response = await emailAPI.initiateGmailAuth();
      window.location.replace(response.url);
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
      setLoading(true);
      setError(null);
      setSuccess(null);
      await emailAPI.sendTestEmail(testEmailAddress);
      setSuccess('Test email sent successfully');
      setTestEmailAddress(''); // Clear the input after successful send
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send test email');
    } finally {
      setLoading(false);
    }
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
        <Typography variant="h4">
          Email Warmup Dashboard
        </Typography>
        {!hasToken && (
          <Button
            variant="contained"
            onClick={handleLinkGmail}
            startIcon={<span>🔗</span>}
          >
            Link Gmail Account
          </Button>
        )}
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
                  disabled={loading}
                  sx={{ minWidth: 120 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Send Test'}
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