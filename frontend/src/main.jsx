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
  import About from './pages/About.jsx'
  import OrdersPage from './pages/OrdersPage.jsx'
  import WorkPage from './pages/WorkPage.jsx'
  import NotFound from './pages/NotFound.jsx'
  import Promotions from './pages/Promotions.jsx'
  import StoresPage from './pages/StoresPage.jsx'
  import ContactPage from './pages/ContactPage.jsx' // ✅ thêm trang Liên hệ
  import Protected from './components/Protected.jsx'
  import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
  import UpdatePasswordPage from './pages/UpdatePasswordPage.jsx'
  import './styles/tw.css' // Sử dụng file CSS đã có

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
        { path: 'promotions', element: <Promotions /> },
        { path: 'stores', element: <StoresPage /> },
        { path: 'contact', element: <ContactPage /> }, // ✅ thêm route Liên hệ
        { path: 'about', element: <About /> },

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
        // { path: 'profile', element: <Protected><Profile /></Protected> },

        // Forgot Password
        { path: 'forgot-password', element: <ForgotPasswordPage /> },
        { path: 'update-password', element: <UpdatePasswordPage /> },
        
        // Manager only routes
        { 
          path: 'manager/menu', 
          element: (
            <Protected roles={['manager']}>
              <div className="p-8">
                <h1 className="text-2xl font-bold">Menu Management</h1>
                <p className="text-gray-600 mt-2">Coming soon...</p>
              </div>
            </Protected>
          ),
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
