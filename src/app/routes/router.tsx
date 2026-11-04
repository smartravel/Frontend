import { createBrowserRouter } from 'react-router'
import { Layout } from '../../widgets/Layout'
import { LoginPage } from '../../pages/LoginPage'
import { TripsPage } from '../../pages/TripsPage'
import { TripPage } from '../../pages/TripPage'
import { NotFoundPage } from '../../pages/NotFoundPage'
import { RegisterPage } from '../../pages/RegisterPage/RegisterPage'
import { GuestRoute } from './GuestRoute'
import { ProtectedRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/', element: <TripsPage /> },
          { path: '/trips/:tripId', element: <TripPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
