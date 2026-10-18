import { Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import AppRoutes from './Routes';

const state = vi.hoisted(() => ({
  auth: { isAuthenticated: false, isLoading: false, user: null },
  subscription: { isLoading: false, isPremium: false, isRealtor: false },
}));
vi.mock('@auth/context/AuthContext', () => ({ useAuth: () => state.auth }));
vi.mock('@subscription/context/SubscriptionContext', () => ({ useSubscription: () => state.subscription }));
vi.mock('@supabaseClient', () => ({ supabase: { auth: { getSession: vi.fn() } } }));
vi.mock('@shared/hooks/useGoogleAnalytics', () => ({ useGoogleAnalytics: vi.fn() }));
vi.mock('@layout/MainLayout', () => ({ default: function Layout() {
  const navigate = useNavigate();
  return <><Link to="/about">About link</Link><button onClick={() => navigate(-1)}>Back</button><Outlet /></>;
} }));
vi.mock('@pages/districtMap/DistrictMap', () => ({ default: function Map() {
  const { country, city } = useParams();
  return <div>Map {country} {city}</div>;
} }));
vi.mock('@auth/Login', () => ({ default: function Login() {
  const location = useLocation();
  return <div>Login from {location.state?.from?.pathname}</div>;
} }));
vi.mock('@profile/ProfilePage', () => ({ default: () => <div>Profile content</div> }));
vi.mock('@pages/favorites/FavoritesPage', () => ({ default: () => <div>Favorites content</div> }));
vi.mock('@components/stats/components/DistrictComparison/DistrictComparisonPage', () => ({ default: () => <div>Comparison content</div> }));
vi.mock('@subscription/Subscription', () => ({ default: () => <div>Subscription content</div> }));
vi.mock('@pages/admin/AdminPanel', () => ({ default: () => <div>Admin login panel</div> }));
vi.mock('@pages/notFound/NotFoundPage', () => ({ default: () => <div>Not found</div> }));
vi.mock('@pages/about/About', () => ({ default: () => <div>About content</div> }));

function visit(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><Suspense fallback={<div>Loading</div>}><AppRoutes /></Suspense></MemoryRouter>);
}

beforeEach(() => {
  state.auth.isAuthenticated = false;
  state.auth.isLoading = false;
  state.subscription.isLoading = false;
  state.subscription.isPremium = false;
  state.subscription.isRealtor = false;
});

describe('application routes on React Router 7', () => {
  it('preserves map parameters and back navigation', async () => {
    visit('/map/PL/Warsaw?district=123');
    expect(await screen.findByText('Map PL Warsaw')).toBeInTheDocument();
    fireEvent.click(screen.getByText('About link'));
    expect(await screen.findByText('About content')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Back'));
    expect(await screen.findByText('Map PL Warsaw')).toBeInTheDocument();
  });
  it('redirects guests to login and preserves their destination', async () => {
    visit('/payment');
    expect(await screen.findByText('Login from /payment')).toBeInTheDocument();
  });
  it('allows authenticated profile access', async () => {
    state.auth.isAuthenticated = true;
    visit('/profile');
    expect(await screen.findByText('Profile content')).toBeInTheDocument();
  });
  it('keeps free users out of Premium favorites', async () => {
    state.auth.isAuthenticated = true;
    visit('/favorites');
    expect(await screen.findByText('Subscription content')).toBeInTheDocument();
    expect(screen.queryByText('Favorites content')).not.toBeInTheDocument();
  });
  it('allows Premium favorites', async () => {
    state.auth.isAuthenticated = true;
    state.subscription.isPremium = true;
    visit('/favorites');
    expect(await screen.findByText('Favorites content')).toBeInTheDocument();
  });
  it.each([false, true])('enforces the Realtor guard on nested comparison (Realtor: %s)', async realtor => {
    state.auth.isAuthenticated = true;
    state.subscription.isPremium = true;
    state.subscription.isRealtor = realtor;
    visit('/profile/stats/compare');
    expect(await screen.findByText(realtor ? 'Comparison content' : 'Subscription content')).toBeInTheDocument();
  });
  it('keeps the admin wildcard accessible to its own login screen', async () => {
    visit('/admin/users');
    expect(await screen.findByText('Admin login panel')).toBeInTheDocument();
  });
  it('renders not-found for unknown paths', async () => {
    visit('/unknown/path');
    expect(await screen.findByText('Not found')).toBeInTheDocument();
  });
});
