import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '@layout/MainLayout';
import PrivateRoute from './PrivateRoute';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import { useGoogleAnalytics } from '@shared/hooks/useGoogleAnalytics';
import { FEATURES_CONFIG } from '../config/features';

const DistrictMap = lazy(() => import('@pages/districtMap/DistrictMap'));
const Contacts = lazy(() => import('@pages/contacts/Contacts'));
const Subscription = lazy(() => import('@subscription/Subscription'));
const Login = lazy(() => import('@auth/Login'));
const Register = lazy(() => import('@auth/Register'));
const ForgotPassword = lazy(() => import('@auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@auth/ResetPassword'));
const TermsOfService = lazy(() => import('@pages/terms/TermsOfService'));
const About = lazy(() => import('@pages/about/About'));
const Payment = lazy(() => import('@pages/payment/Payment'));
const RegisterSuccess = lazy(() => import('@auth/RegisterSuccess'));
const AuthCallback = lazy(() => import('@auth/AuthCallback'));
const PaymentSuccess = lazy(() => import('@pages/payment/PaymentSuccess'));
const FavoritesPage = lazy(() => import('@pages/favorites/FavoritesPage'));
const FaqPage = lazy(() => import('@pages/faq/FaqPage'));
const NotFoundPage = lazy(() => import('@pages/notFound/NotFoundPage'));
const StatsPage = lazy(() => import('@components/stats/StatsPage'));
const Comparison = lazy(() => import('@components/stats/components/DistrictComparison/DistrictComparisonPage'));
const AdminPanel = lazy(() => import('@pages/admin/AdminPanel'));
const ProfilePage = lazy(() => import('@profile/ProfilePage'));

export default function AppRoutes() {
  useGoogleAnalytics(import.meta.env.VITE_GA_ID);

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route path="admin/*" element={<AdminRoute><AdminPanel /></AdminRoute>} />
        <Route index element={<DistrictMap />} />
        <Route path="city/:country" element={<DistrictMap />} />
        <Route path="map/:country/:city" element={<DistrictMap />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="about" element={<About />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="terms" element={<TermsOfService />} />
        {FEATURES_CONFIG.ENABLE_SUBSCRIPTIONS_PAGE && (
          <Route path="subscription" element={<Subscription />} />
        )}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="auth/reset-password" element={<ResetPassword />} />
        <Route path="profile/password" element={<ResetPassword />} />
        <Route path="register-success" element={<RegisterSuccess />} />
        <Route path="auth/callback" element={<AuthCallback />} />
        <Route
          path="favorites"
          element={
            <PrivateRoute>
              <ProtectedRoute requiredPlan="premium">
                <FavoritesPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />
        <Route path="profile/stats">
          <Route
            index
            element={
              <PrivateRoute>
                <ProtectedRoute requiredPlan="premium">
                  <StatsPage />
                </ProtectedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="compare"
            element={
              <PrivateRoute>
                <ProtectedRoute requiredPlan="realtor">
                  <Comparison />
                </ProtectedRoute>
              </PrivateRoute>
            }
          />
        </Route>
        <Route path="profile">
          <Route index element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        </Route>
        <Route path="payment" element={<PrivateRoute><Payment /></PrivateRoute>} />
        <Route path="payment-success" element={<PaymentSuccess />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
