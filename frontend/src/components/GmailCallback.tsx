import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Container, Typography, CircularProgress, Alert } from '@mui/material';
import { emailAPI } from '../services/api';

export const GmailCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  useEffect(() => {
    const handleCallback = async () => {
      if (error) {
        navigate('/dashboard', { state: { error: 'Failed to link Gmail account' } });
        return;
      }

      if (!code || !state) {
        navigate('/dashboard', { state: { error: 'Invalid callback parameters' } });
        return;
      }

      try {
        // The backend will handle the OAuth2 callback
        // We just need to redirect back to the dashboard
        navigate('/dashboard', { 
          state: { 
            success: 'Gmail account linked successfully. You can now send emails using your Gmail account.' 
          } 
        });
      } catch (err) {
        console.error('Error handling Gmail callback:', err);
        navigate('/dashboard', { 
          state: { 
            error: 'Failed to process Gmail callback. Please try again.' 
          } 
        });
      }
    };

    handleCallback();
  }, [code, state, error, navigate]);

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="h6">
          {error ? 'Processing error...' : 'Linking Gmail account...'}
        </Typography>
      </Box>
    </Container>
  );
}; 