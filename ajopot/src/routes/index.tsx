import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import AdminShell from '@/components/admin/AdminShell'
import ProtectedRoute from './ProtectedRoute'
import AdminRoute from './AdminRoute'
import LoginPage from '@/pages/auth/LoginPage'
import SignupFormPage from '@/pages/auth/SignupFormPage'
import PlanSelectPage from '@/pages/auth/PlanSelectPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import GroupsPage from '@/pages/groups/GroupsPage'
import GroupDetailPage from '@/pages/groups/GroupDetailPage'
import GroupPublicView from '@/pages/public/GroupPublicView'
import SettingsPage from '@/pages/settings/SettingsPage'
import AdminLoginPage from '@/pages/admin/AdminLoginPage'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminUserDetail from '@/pages/admin/AdminUserDetail'
import AdminGroups from '@/pages/admin/AdminGroups'
import AdminSubscriptions from '@/pages/admin/AdminSubscriptions'
import AdminActivity from '@/pages/admin/AdminActivity'
import PaymentCallbackPage from '@/pages/PaymentCallbackPage'
import NotFoundPage from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  // Public
  { path: '/login', element: <LoginPage /> },
  { path: '/g/:token', element: <GroupPublicView /> },

  // Admin
  { path: '/admin/login', element: <AdminLoginPage /> },
  { path: '/admin', element: <Navigate to="/admin/dashboard" replace /> },
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AdminShell />,
        children: [
          { path: '/admin/dashboard', element: <AdminDashboard /> },
          { path: '/admin/users', element: <AdminUsers /> },
          { path: '/admin/users/:userId', element: <AdminUserDetail /> },
          { path: '/admin/groups', element: <AdminGroups /> },
          { path: '/admin/subscriptions', element: <AdminSubscriptions /> },
          { path: '/admin/activity', element: <AdminActivity /> },
        ],
      },
    ],
  },

  // User app
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/signup', element: <SignupFormPage /> },
      { path: '/plan-select', element: <PlanSelectPage /> },
      { path: '/payment/callback', element: <PaymentCallbackPage /> },
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/groups', element: <GroupsPage /> },
          { path: '/groups/:id', element: <GroupDetailPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
])
