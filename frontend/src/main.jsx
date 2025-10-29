import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AuthProvider } from './lib/auth.jsx'
import App from './App.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import MenuPage from './pages/MenuPage.jsx'
import CartPage from './pages/CartPage.jsx'
import OrdersPage from './pages/OrdersPage.jsx'
import WorkPage from './pages/WorkPage.jsx'
import NotFound from './pages/NotFound.jsx'
import Protected from './components/Protected.jsx'

// Admin pages
import DashboardPage from './pages/admin/DashboardPage.jsx'
import ProductsPage from './pages/admin/ProductsPage.jsx'
import AdminOrdersPage from './pages/admin/OrdersPage.jsx'

import './styles/tw.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <NotFound />,
    children: [
      // Public routes
      { index: true, element: <HomePage /> },
      { path: 'menu', element: <MenuPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },

      // Protected routes
      {
        path: 'cart',
        element: <Protected><CartPage /></Protected>
      },
      {
        path: 'orders',
        element: <Protected><OrdersPage /></Protected>
      },

      // Staff/Manager routes
      {
        path: 'work',
        element: <Protected roles={['staff', 'manager']}><WorkPage /></Protected>
      },
      {
        path: 'staff/orders',
        element: <Protected roles={['staff', 'manager']}><WorkPage /></Protected>
      },

      // Manager only routes
      {
        path: 'manager/menu',
        element: <Protected roles={['manager']}>
          <div className="p-8">
            <h1 className="text-2xl font-bold">Menu Management</h1>
            <p className="text-gray-600 mt-2">Coming soon...</p>
          </div>
        </Protected>
      },
    ],
  },

  // Admin routes - separate from main app layout (no NavBar)
  {
    path: '/admin',
    element: <DashboardPage />,
    errorElement: <NotFound />,
  },
  {
    path: '/admin/products',
    element: <ProductsPage />,
    errorElement: <NotFound />,
  },
  {
    path: '/admin/orders',
    element: <AdminOrdersPage />,
    errorElement: <NotFound />,
  },
])

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
)