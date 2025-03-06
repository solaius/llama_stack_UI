import React from 'react';
import { Box, Typography, Paper, Card, CardContent, Button } from '@mui/material';
import { Assessment as AssessmentIcon } from '@mui/icons-material';

const EvaluationsPage: React.FC = () => {
  return (
    <Box>
      <Paper elevation={0} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Evaluations
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Run and view evaluations on model performance.
        </Typography>
      </Paper>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <AssessmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Evaluations Feature Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            This feature is currently under development. Check back later for updates.
          </Typography>
          <Button variant="outlined" component="a" href="/">
            Return to Home
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EvaluationsPage;