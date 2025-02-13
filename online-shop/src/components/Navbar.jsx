import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { Link } from 'react-router-dom';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

function Navbar() {
  return (
    <AppBar position="static">
      <Container>
        <Toolbar>
          <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
            فروشگاه آنلاین
          </Typography>
          <Button color="inherit" component={Link} to="/products">
            محصولات
          </Button>
          <Button color="inherit" startIcon={<ShoppingCartIcon />}>
            سبد خرید
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar; 