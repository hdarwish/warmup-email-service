import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
} from '@mui/material';
import { Mail, Email } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Hardcoded users for demonstration
const USERS = [
  {
    id: 'user1',
    tenantId: 'tenant1',
    name: 'Gmail User',
    provider: 'gmail',
  },
  {
    id: 'user2',
    tenantId: 'tenant2',
    name: 'Outlook User',
    provider: 'outlook',
  },
];

const AccountLinking: React.FC = () => {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLinkAccount = async (provider: 'gmail' | 'outlook') => {
    if (!selectedUser) {
      setError('Please select a user first');
      return;
    }

    const user = USERS.find(u => u.id === selectedUser);
    if (!user) {
      setError('Invalid user selected');
      return;
    }

    try {
      // In a real application, this would redirect to the OAuth flow
      // For demonstration, we'll simulate a successful linking
      console.log(`Linking ${provider} account for user ${user.name}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to dashboard on success
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to link account. Please try again.');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Link Email Account
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {USERS.map((user) => (
            <Grid item xs={12} sm={6} key={user.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  border: selectedUser === user.id ? '2px solid #1976d2' : 'none',
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {user.name}
                  </Typography>
                  <Typography color="textSecondary">
                    Tenant ID: {user.tenantId}
                  </Typography>
                  <Typography color="textSecondary">
                    User ID: {user.id}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    fullWidth
                    variant={selectedUser === user.id ? 'contained' : 'outlined'}
                    onClick={() => setSelectedUser(user.id)}
                  >
                    Select User
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2} sx={{ mt: 3 }}>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Mail />}
              onClick={() => handleLinkAccount('gmail')}
              disabled={!selectedUser}
            >
              Link Gmail Account
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Email />}
              onClick={() => handleLinkAccount('outlook')}
              disabled={!selectedUser}
            >
              Link Outlook Account
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default AccountLinking; 