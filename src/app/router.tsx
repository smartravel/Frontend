import { createBrowserRouter } from 'react-router'
import { Layout } from '../widgets/Layout'
import { LoginPage } from '../pages/LoginPage'
import { TripsPage } from '../pages/TripsPage'
import { TripPage } from '../pages/TripPage'
import { NotFoundPage } from '../pages/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <Layout />,
    children: [
      { path: '/', element: <TripsPage /> },
      { path: '/trips/:tripId', element: <TripPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
