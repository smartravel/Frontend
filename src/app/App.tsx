import { CssBaseline, ThemeProvider } from '@mui/material'
import { useEffect } from 'react'
import { RouterProvider } from 'react-router'
import { useSession } from '../entities/user'
import { setUnauthorizedHandler } from '../shared/api'
import { router } from './router'
import { theme } from './styles/themes'

setUnauthorizedHandler(() => useSession.getState().reset())

function App() {
  const init = useSession((state) => state.init)

  useEffect(() => {
    init()
  }, [init])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

export default App
