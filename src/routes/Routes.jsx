import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "@layout/MainLayout";

import PrivateRoute from "./PrivateRoute";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

const DistrictMap = lazy(() => import("../components/districtMap/DistrictMap"));
const Contacts = lazy(() => import("@/pages/Contacts"));
const Subscription = lazy(() => import("@pages/subscription/Subscription"));
const Login = lazy(() => import("@auth/Login"));
const Register = lazy(() => import("@auth/Register"));
const ForgotPassword = lazy(() => import("@auth/ForgotPassword"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const About = lazy(() => import("@/pages/About"));
const Profile = lazy(() => import("../components/profile/Profile"));
const Payment = lazy(() => import("@pages/payment/Payment"));
const RegisterSuccess = lazy(() => import("../components/auth/RegisterSuccess"));
const AuthCallback = lazy(() => import("../components/auth/AuthCallback"));
const PaymentSuccess = lazy(() => import("@pages/payment/PaymentSuccess"));
const FavoritesPage = lazy(() => import('@pages/favorites/FavoritesPage'));
const FaqPage = lazy(() => import('@pages/FaqPage'));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const StatsPage = lazy(() => import("../components/stats/StatsPage"));
const Comparison = lazy(() => import("../components/stats/components/DistrictComparison/DistrictComparisonPage"));
const AdminPanel = lazy(() => import("@pages/admin/AdminPanel"));
const BillingHistoryPage = lazy(() => import("../components/profile/BillingHistory/BillingHistoryPage"));
const ProfileEditPage = lazy(() => import("../components/profile/ProfileEditPage"));
const PasswordChangePage = lazy(() => import("../components/profile/PasswordChangePage"));

export default function AppRoutes() {
  return (
      <Routes>
        <Route path="/" element={<MainLayout />}>
          
          <Route index element={<DistrictMap />} />
          <Route path="city/:country" element={<DistrictMap />} />
          <Route path="map/:country/:city" element={<DistrictMap />} />

          <Route path="contacts" element={<Contacts />} />
          <Route path="about" element={<About />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="terms" element={<TermsOfService />} />
          <Route path="subscription" element={<Subscription />} />

          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="register-success" element={<RegisterSuccess />} />
          <Route path="auth/callback" element={<AuthCallback />} />

          {/* ВИПРАВЛЕНО: Використовуємо AdminRoute замість PrivateRoute */}
          <Route path="parser" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          
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
            <Route index element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="billing-history" element={<PrivateRoute><BillingHistoryPage /></PrivateRoute>} />
            <Route path="edit" element={<PrivateRoute><ProfileEditPage /></PrivateRoute>} />
            <Route path="password" element={<PrivateRoute><PasswordChangePage /></PrivateRoute>} />
          </Route>

          <Route path="payment" element={<PrivateRoute><Payment /></PrivateRoute>} />
          <Route path="payment-success" element={<PaymentSuccess />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
  );
}