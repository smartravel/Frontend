import { Link } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { LoginForm } from '../../features/auth'
import { AuthLayout } from '../../widgets/AuthLayout'

export function LoginPage() {
  return (
    <AuthLayout
      title="Вход"
      subtitle="Рады видеть снова"
      footer={
        <>
          Нет аккаунта?{' '}
          <Link component={RouterLink} to="/register" sx={{ fontWeight: 700 }}>
            Зарегистрироваться
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  )
}
