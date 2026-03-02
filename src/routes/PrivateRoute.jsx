import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@ui/authForm/AuthContext';
import { userConsentApi } from '@api/userConsentApi';

const PrivateRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [hasConsent, setHasConsent] = useState(null);
  const [consentLoading, setConsentLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    if (!authLoading) {
      if (isAuthenticated && user) {
        userConsentApi.checkConsentStatus(user.id)
          .then((consent) => {
            if (mounted) {
              setHasConsent(consent);
              setConsentLoading(false);
            }
          })
          .catch(() => {
            if (mounted) {
              setHasConsent(false);
              setConsentLoading(false);
            }
          });
      } else {
        if (mounted) {
          setHasConsent(false);
          setConsentLoading(false);
        }
      }
    }

    return () => { mounted = false; };
  }, [authLoading, isAuthenticated, user]);

  if (authLoading || consentLoading) return null; 

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasConsent) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;