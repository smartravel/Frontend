import { createBrowserRouter, Navigate } from 'react-router'
import { Layout } from '../../widgets/Layout'
import { LoginPage } from '../../pages/LoginPage'
import { TripsPage } from '../../pages/TripsPage'
import { TripPage } from '../../pages/TripPage'
import { TripSectionPage } from '../../pages/TripSectionPage'
import { NotFoundPage } from '../../pages/NotFoundPage'
import { RegisterPage } from '../../pages/RegisterPage'
import { ProfilePage } from '../../pages/ProfilePage'
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
          { path: '/profile', element: <ProfilePage /> },
          {
            path: '/trips/:tripId',
            element: <TripPage />,
            children: [
              { index: true, element: <Navigate to="route" replace /> },
              { path: 'route', element: <TripSectionPage title="Маршрут" /> },
              { path: 'checklist', element: <TripSectionPage title="Чеклист" /> },
              { path: 'polls', element: <TripSectionPage title="Опросы" /> },
              { path: 'expenses', element: <TripSectionPage title="Расходы" /> },
              { path: 'dates', element: <TripSectionPage title="Даты" /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
