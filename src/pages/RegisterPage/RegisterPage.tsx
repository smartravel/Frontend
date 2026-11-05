import { Link } from '@mui/material'
import { Link as RouterLink, useLocation } from 'react-router'
import { RegisterForm } from '../../features/auth'
import { AuthLayout } from '../../widgets/AuthLayout'

export function RegisterPage() {
  const location = useLocation()

  return (
    <AuthLayout
      title="Регистрация"
      subtitle="Аватарку-эмодзи выберете потом в профиле"
      footer={
        <>
          Уже есть аккаунт?{' '}
          <Link component={RouterLink} to="/login" state={location.state} sx={{ fontWeight: 700 }}>
            Войти
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  )
}
