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
import PaymentSuccess from "../pages/payment/PaymentSuccess";
import FavoritesPage from '../pages/favorites/FavoritesPage';
import FaqPage from '../pages/faq/FaqPage';
import NotFoundPage from "../pages/notFound/NotFoundPage";

// Routes guards
import PrivateRoute from "./PrivateRoute";
import ProtectedRoute from "./ProtectedRoute";

// Profile components
import StatsPage from "../components/profile/StatsPage";
import BillingHistoryPage from "../components/profile/BillingHistoryPage";
import ProfileEditPage from "../components/profile/ProfileEditPage";
import PasswordChangePage from "../components/profile/PasswordChangePage";

// Parser (Admin Panel)

// import Admin from "../pages/admin/index";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* --- Public Routes --- */}
        <Route index element={<DistrictMap />} />
        <Route path="city/:country" element={<DistrictMap />} />
        <Route path="map/:country/:city" element={<DistrictMap />} />
        
        <Route path="contacts" element={<Contacts />} />
        <Route path="about" element={<About />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="terms" element={<TermsOfService />} />
        
        <Route path="subscription" element={<Subscription />} />
        
        {/* --- Auth Routes --- */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="register-success" element={<RegisterSuccess />} />
        <Route path="auth/callback" element={<AuthCallback />} />


  {/* --- Protected / Private Routes --- */}

        

        {/* Адмін-панель для парсингу (Захищено) */}

        {/* <Route 

          path="parser" 

          element={

            <PrivateRoute>

              <Admin />

            </PrivateRoute>

          } 

        />   */}
        
        <Route 
          path="/favorites" 
          element={
            <PrivateRoute>
              <FavoritesPage />
            </PrivateRoute>
          } 
        />

        <Route path="profile">
          <Route 
            index 
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } 
          />
          <Route
            path="stats"
            element={
              <PrivateRoute>
                <ProtectedRoute requiredPlan="premium">
                  <StatsPage />
                </ProtectedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="billing-history"
            element={
              <PrivateRoute>
                <BillingHistoryPage />
              </PrivateRoute>
            }
          />
          <Route
            path="edit"
            element={
              <PrivateRoute>
                <ProfileEditPage />
              </PrivateRoute>
            }
          />
          <Route
            path="password"
            element={
              <PrivateRoute>
                <PasswordChangePage />
              </PrivateRoute>
            }
          />
        </Route>

        <Route
          path="payment"
          element={
            <PrivateRoute>
              <Payment />
            </PrivateRoute>
          }
        />
        <Route path="payment-success" element={<PaymentSuccess />} />

        {/* --- 404 Route (Має бути останнім) --- */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}