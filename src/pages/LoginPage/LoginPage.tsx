import { Link } from '@mui/material'
import { Link as RouterLink, useLocation } from 'react-router'
import { LoginForm } from '../../features/auth'
import { AuthLayout } from '../../widgets/AuthLayout'

export function LoginPage() {
  const location = useLocation()

  return (
    <AuthLayout
      title="Вход"
      subtitle="Рады видеть снова"
      footer={
        <>
          Нет аккаунта?{' '}
          <Link
            component={RouterLink}
            to="/register"
            state={location.state}
            sx={{ fontWeight: 700 }}
          >
            Зарегистрироваться
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  )
}
