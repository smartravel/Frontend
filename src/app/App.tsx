import { RouterProvider } from 'react-router'
import {theme} from './styles/themes'
import { ThemeProvider, CssBaseline} from '@mui/material'
import { router } from './router'


function App() {

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <RouterProvider router={router}/>
    </ThemeProvider>

  )
}

export default App
