import { Box, Container, Link } from "@mui/material";
import { Outlet, Link as RouterLink} from "react-router";

export function Layout() {
  return (
    <>
      <Box
        component="header"
        sx={{ px: 5, py: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
      >
        <Link component={RouterLink} to="/" underline="none" variant="h3" color="text.primary">
          SmartTravel
        </Link>
      </Box>
      <Container component="main" maxWidth="lg" sx={{ py: 6 }}>
        <Outlet />
      </Container>
    </>
  )
}