import {createTheme} from '@mui/material/styles'

export const theme = createTheme({
    palette: {
        primary: { main: '#0E7C86', dark: '#0A5E66', light: '#DDF1F2', contrastText: '#FFFFFF' },
        secondary: { main: '#F28F3B', light: '#FDEBDB', dark: '#8A4A12', contrastText: '#1B2433' },
        error: {main: '#c2410c'},
        text: { primary: '#1B2433', secondary: '#5B6576' },
        background: { default: '#F4F7FA', paper: '#FFFFFF' },
        divider: '#E3E8EF',
    },
    typography: {
        fontFamily: "'Manrope', system-ui, sans-serif",
        h1: { fontFamily: "'Unbounded', sans-serif", fontWeight: 600, fontSize: '2.125rem' },
        h2: { fontFamily: "'Unbounded', sans-serif", fontWeight: 600, fontSize: '1.25rem' },
        h3: { fontFamily: "'Unbounded', sans-serif", fontWeight: 600, fontSize: '1.125rem' },
        button: { textTransform: 'none', fontWeight: 700 },
    },
    shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 14, minHeight: 48, paddingInline: 22 } },
    },
    MuiTab: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600, fontSize: 15 } },
    },
  },
})