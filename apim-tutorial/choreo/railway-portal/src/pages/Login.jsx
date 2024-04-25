import React from 'react';
import { Button, Typography, Box, Paper, Container } from '@mui/material';

function Login(props) {
    const { isLoggedIn } = props;
    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <Container maxWidth="xs">
                <Paper
                    elevation={3}
                    sx={{
                        padding: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center' }}>
                        Welcome to Railway Service
                    </Typography>
                    {!isLoggedIn && (
                        <Typography variant="body1" gutterBottom sx={{ textAlign: 'center' }}>
                            You need to log in to access the services
                        </Typography>
                    )}
                    <Button
                        variant="contained"
                        color="secondary"
                        sx={{ mt: 2, mb: 2}}
                        disabled={isLoggedIn}
                        onClick={() => window.location.href = "/auth/login"}
                    >
                        <strong>Login</strong>
                    </Button>
                    {isLoggedIn && (
                        <Typography variant="body1" gutterBottom sx={{ textAlign: 'center' }}>
                            You have already logged in
                        </Typography>
                    )}
                </Paper>
            </Container>
        </Box>
  );
}

export default Login;
