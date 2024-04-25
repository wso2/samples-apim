import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppBar, Box, Toolbar, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import LogoutIcon from '@mui/icons-material/Logout';
import Cookies from 'js-cookie';
import LandingPage from './pages/Landing';
import NotFound from './pages/NotFound';
import Booking from './pages/Booking';
import Reservation from './pages/Reservation';
import Login from './pages/Login';
import ProtectedRoute from './ProtectedRoute'; 
import trainLogo from "./assets/train.svg";
import theme from './theme';
import './App.css'

function App() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userDetails, setUserDetails] = useState({ username: '' });

  useEffect(() => {
    let isUserInfoSet = false;
    if (import.meta.env.DEV) {
      // Set mock user info in local storage
      const mockUserInfo = { username: 'johndoe', first_name: 'John', last_name: 'Doe', name: 'John Doe'};
      localStorage.setItem('userInfo', JSON.stringify(mockUserInfo));
      isUserInfoSet = true;
    }

    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      setUserDetails(JSON.parse(storedUserInfo));
      setLoggedIn(true);
      isUserInfoSet = true;
    }

    if (!isUserInfoSet) {
      const encodedUserInfo = Cookies.get('userinfo');
      console.log(encodedUserInfo);
      if (encodedUserInfo) {
        const decodedUserInfo = JSON.parse(atob(encodedUserInfo));
        setUserDetails(decodedUserInfo);
        setLoggedIn(true);
        localStorage.setItem('userInfo', JSON.stringify(decodedUserInfo));
      }
    }

    setLoading(false);

  }, []);

  const handleLogout = () => {
    // Clear any stored user information
    setUserDetails({});
    setLoggedIn(false);
    localStorage.removeItem('userInfo');

    // Redirect to Choreo logout with session_hint
    const sessionHint = Cookies.get('session_hint');
    window.location.href = `/auth/logout?session_hint=${sessionHint}`;

    Cookies.remove('userinfo', { path: '/' });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <img src={trainLogo} className="logo-icon" onClick={() => window.location.href = "/"}/>
            <Typography variant="h6" component="div" sx={{ flexGrow: 0 }}>
              <strong>Railway Portal</strong>
            </Typography>
            {loggedIn && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  flexGrow: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Typography component="div">
                  {userDetails.name? userDetails.name: userDetails.first_name + " " + userDetails.last_name}
                </Typography>
                <IconButton color="inherit" onClick={handleLogout}>
                  <LogoutIcon />
                </IconButton>
              </Box>
            )}
          </Toolbar>
        </AppBar>
      </Box>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexGrow: 1,
        }}
      >
        <BrowserRouter>
          <Routes>
            <Route element={<ProtectedRoute isLoggedIn={loggedIn} />}>
              <Route path="/" Component={LandingPage} />
              <Route path="/add-booking" Component={Booking} />
              <Route path="/view-bookings" Component={Reservation} />
            </Route>
            <Route path="/login" element={<Login isLoggedIn={loggedIn} />} />
            <Route path="*" Component={NotFound} />
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  )
}

export default App
