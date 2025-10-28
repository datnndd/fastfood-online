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
import './styles/tw.css' // Sử dụng file CSS đã có
import ProfilePage from './pages/ProfilePage.jsx'

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

      // >>> Thêm dòng này
      { path: 'profile', element: <Protected><ProfilePage /></Protected> },
      
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
])

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
)