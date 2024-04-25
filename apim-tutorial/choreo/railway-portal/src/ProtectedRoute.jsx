import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = (props) => {
  const { isLoggedIn } = props;
  return (
    isLoggedIn ? <Outlet /> : <Navigate to="/login" />
  )
};

export default ProtectedRoute;
