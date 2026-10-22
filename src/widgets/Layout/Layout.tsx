import { Container } from '@mui/material'
import { Outlet } from 'react-router'
import { Header } from '../Header'

export function Layout() {
  return (
    <>
      <Header />
      <Container component="main" maxWidth="lg" sx={{ py: 6 }}>
        <Outlet />
      </Container>
    </>
  )
}
