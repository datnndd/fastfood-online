import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AuthProvider } from './lib/auth.jsx'
import { NotificationProvider } from './contexts/NotificationContext.jsx'
import App from './App.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import MenuPage from './pages/MenuPage.jsx'
import CartPage from './pages/CartPage.jsx'
import About from './pages/About.jsx'
import Promotions from './pages/Promotions.jsx'
import ContactPage from './pages/ContactPage.jsx'
import OrdersPage from './pages/OrdersPage.jsx'
import OrderDetailPage from './pages/OrderDetailPage.jsx'
import WorkPage from './pages/WorkPage.jsx'
import ManagerAccountsPage from './pages/ManagerAccountsPage.jsx'
import ItemsManagement from './pages/ItemsManagement.jsx'
import CombosManagement from './pages/CombosManagement.jsx'
import CategoriesManagement from './pages/CategoriesManagement.jsx'
import ManagerDashboard from './pages/ManagerDashboard.jsx'
import FeedbackManagement from './pages/FeedbackManagement.jsx'
import OrdersDetailReport from './pages/OrdersDetailReport.jsx'
import NotFound from './pages/NotFound.jsx'
import Protected from './components/Protected.jsx'
import UpdatePasswordPage from './pages/UpdatePasswordPage.jsx'
import PaymentSuccessPage from './pages/PaymentSuccessPage.jsx'
import PaymentCancelPage from './pages/PaymentCancelPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import './styles/tw.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'menu', element: <MenuPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'about', element: <About /> },
      { path: 'promotions', element: <Promotions /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'update-password', element: <UpdatePasswordPage /> },
      {
        path: 'cart',
        element: (
          <Protected>
            <CartPage />
          </Protected>
        ),
      },
      {
        path: 'orders',
        element: (
          <Protected>
            <OrdersPage />
          </Protected>
        ),
      },
      {
        path: 'orders/:id',
        element: (
          <Protected>
            <OrderDetailPage />
          </Protected>
        ),
      },
      {
        path: 'profile',
        element: (
          <Protected>
            <ProfilePage />
          </Protected>
        ),
      },
      {
        path: 'work',
        element: (
          <Protected roles={['staff', 'manager']}>
            <WorkPage />
          </Protected>
        ),
      },
      {
        path: 'staff/orders',
        element: (
          <Protected roles={['staff', 'manager']}>
            <WorkPage />
          </Protected>
        ),
      },
      {
        path: 'manager',
        element: (
          <Protected roles={['manager']}>
            <ManagerDashboard />
          </Protected>
        ),
      },
      {
        path: 'manager/dashboard',
        element: (
          <Protected roles={['manager']}>
            <ManagerDashboard />
          </Protected>
        ),
      },
      {
        path: 'manager/categories',
        element: (
          <Protected roles={['manager']}>
            <CategoriesManagement />
          </Protected>
        ),
      },
      {
        path: 'manager/menu',
        element: (
          <Protected roles={['manager']}>
            <ItemsManagement />
          </Protected>
        ),
      },
      {
        path: 'manager/combos',
        element: (
          <Protected roles={['manager']}>
            <CombosManagement />
          </Protected>
        ),
      },
      {
        path: 'manager/accounts',
        element: (
          <Protected roles={['manager']}>
            <ManagerAccountsPage />
          </Protected>
        ),
      },
      {
        path: 'manager/orders-report',
        element: (
          <Protected roles={['manager']}>
            <OrdersDetailReport />
          </Protected>
        ),
      },
      {
        path: 'manager/feedbacks',
        element: (
          <Protected roles={['manager']}>
            <FeedbackManagement />
          </Protected>
        ),
      },
      {
        path: 'payment/success',
        element: (
          <Protected>
            <PaymentSuccessPage />
          </Protected>
        ),
      },
      {
        path: 'payment/cancel',
        element: (
          <Protected>
            <PaymentCancelPage />
          </Protected>
        ),
      },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <RouterProvider router={router} />
      </NotificationProvider>
    </AuthProvider>
  </React.StrictMode>
)
