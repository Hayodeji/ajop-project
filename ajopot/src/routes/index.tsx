import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import AdminShell from '@/components/admin/AdminShell'
import ProtectedRoute from './ProtectedRoute'
import AdminRoute from './AdminRoute'
import LoginPage from '@/pages/auth/LoginPage'
import SignupFormPage from '@/pages/auth/SignupFormPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import PlanSelectPage from '@/pages/auth/PlanSelectPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import GroupsPage from '@/pages/groups/GroupsPage'
import GroupDetailPage from '@/pages/groups/GroupDetailPage'
import GroupMembersPage from '@/pages/groups/GroupMembersPage'
import GroupPublicView from '@/pages/public/GroupPublicView'
import ProfilePage from '@/pages/ProfilePage'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminUserDetail from '@/pages/admin/AdminUserDetail'
import AdminSubscriptions from '@/pages/admin/AdminSubscriptions'
import AdminEngagement from '@/pages/admin/AdminEngagement'
import PaymentCallbackPage from '@/pages/PaymentCallbackPage'
import NotFoundPage from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  // Public
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/g/:token', element: <GroupPublicView /> },

  // Admin
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
          { path: '/admin/subscriptions', element: <AdminSubscriptions /> },
          { path: '/admin/engagement', element: <AdminEngagement /> },
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
          { path: '/groups/:id/members', element: <GroupMembersPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
])
