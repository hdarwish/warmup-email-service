import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';

export const Header: React.FC = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Email Warmup Service
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}; 