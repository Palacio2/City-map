import { Routes, Route } from "react-router-dom";
import MainLayout from "@layout/MainLayout";
import DistrictMap from "@maps/DistrictMap";
import Contacts from "@pages/contacts/Contacts";
import Subscription from "@pages/subscription/Subscription";
import Login from "@auth/Login";
import Register from "@auth/Register";
import ForgotPassword from "@auth/ForgotPassword";
import TermsOfService from "@pages/termsOfService/TermsOfService";
import About from "@pages/about/About";
import Profile from "../components/profile/Profile";
import Payment from "@pages/payment/Payment";
import RegisterSuccess from "../components/auth/RegisterSuccess";
import AuthCallback from "../components/auth/AuthCallback";
import PrivateRoute from "./PrivateRoute";
import ProtectedRoute from "./ProtectedRoute"; // Імпорт ProtectedRoute

// Імпортуємо нові компоненти профілю
import StatsPage from "../components/profile/StatsPage";
import BillingHistoryPage from "../components/profile/BillingHistoryPage";
import ProfileEditPage from "../components/profile/ProfileEditPage";
import PasswordChangePage from "../components/profile/PasswordChangePage";
import PaymentSuccess from "../pages/payment/PaymentSuccess";
import Billing from "../pages/billing/Billing";
import FavoritesPage from '../pages/favorites/FavoritesPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Публічні маршрути */}
        <Route index element={<DistrictMap />} />
        <Route path="city/:country" element={<DistrictMap />} />
        <Route path="map/:country/:city" element={<DistrictMap />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="subscription" element={<Subscription />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="terms" element={<TermsOfService />} />
        <Route path="about" element={<About />} />
        <Route path="register-success" element={<RegisterSuccess />} />
        <Route path="auth/callback" element={<AuthCallback />} />
        <Route path="payment-success" element={<PaymentSuccess />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        

        {/* Приватні маршрути */}
        <Route
          path="profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="profile/stats"
          element={
            <PrivateRoute>
              <ProtectedRoute requiredPlan="premium">
                <StatsPage />
              </ProtectedRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="profile/billing-history"
          element={
            <PrivateRoute>
              <BillingHistoryPage />
            </PrivateRoute>
          }
        />
        <Route
          path="profile/edit"
          element={
            <PrivateRoute>
              <ProfileEditPage />
            </PrivateRoute>
          }
        />
        <Route
          path="profile/password"
          element={
            <PrivateRoute>
              <PasswordChangePage />
            </PrivateRoute>
          }
        />

        <Route
          path="payment"
          element={
            <PrivateRoute>
              <Payment />
            </PrivateRoute>
          }
        />

        <Route
          path="billing"
          element={
            <PrivateRoute>
              <Billing />
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  );
}