import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Link,
  Divider,
} from '@mui/material';
import { Header } from '../components/Header';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await authAPI.register({
          email: formData.email,
          password: formData.password,
        });
      }
      await authAPI.login({
        email: formData.email,
        password: formData.password,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', py: 4 }}>
        <Container maxWidth="sm">
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" align="center" gutterBottom>
              {isRegistering ? 'Create Account' : 'Welcome Back'}
            </Typography>
            <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
              {isRegistering 
                ? 'Sign up to start warming up your email'
                : 'Sign in to continue to your dashboard'}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                required
                autoComplete="email"
              />
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                required
                autoComplete={isRegistering ? "new-password" : "current-password"}
              />
              {isRegistering && (
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  margin="normal"
                  required
                  autoComplete="new-password"
                />
              )}
              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ mt: 3 }}
                size="large"
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : isRegistering ? (
                  'Create Account'
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2 }}>or</Divider>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                </Typography>
                <Link
                  component="button"
                  variant="body1"
                  onClick={() => setIsRegistering(!isRegistering)}
                  sx={{ 
                    textDecoration: 'none',
                    color: 'primary.main',
                    fontWeight: 'bold',
                    '&:hover': {
                      textDecoration: 'underline',
                    }
                  }}
                >
                  {isRegistering ? 'Sign in' : 'Create an account'}
                </Link>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}; 