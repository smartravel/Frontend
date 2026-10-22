import {theme} from './styles/themes'
import { ThemeProvider, CssBaseline, Button, Typography, Stack} from '@mui/material'

function App() {

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline>
        <Stack direction='row' spacing={2}>
          <Typography variant='h1'>Мои поездки</Typography>
          <Typography color='text.secondary'>Казань</Typography>
          <Button variant='contained'>Создать поездку</Button>
        </Stack>
      </CssBaseline>
    </ThemeProvider>

  )
}

export default App
