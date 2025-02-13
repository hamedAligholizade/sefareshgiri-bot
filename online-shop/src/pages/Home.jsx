import { Box, Container, Typography, Button, Grid, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PaymentsIcon from '@mui/icons-material/Payments';

function Home() {
  const features = [
    {
      icon: <ShoppingBagIcon sx={{ fontSize: 40 }} />,
      title: 'تنوع محصولات',
      description: 'دسترسی به طیف گسترده‌ای از محصولات'
    },
    {
      icon: <LocalShippingIcon sx={{ fontSize: 40 }} />,
      title: 'ارسال سریع',
      description: 'تحویل سریع و مطمئن به سراسر کشور'
    },
    {
      icon: <PaymentsIcon sx={{ fontSize: 40 }} />,
      title: 'پرداخت امن',
      description: 'درگاه پرداخت امن و مطمئن'
    },
    {
      icon: <SupportAgentIcon sx={{ fontSize: 40 }} />,
      title: 'پشتیبانی ۲۴/۷',
      description: 'همیشه در دسترس شما هستیم'
    }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
          color: 'white',
          py: { xs: 8, md: 15 },
          mb: 6
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 'bold',
                  mb: 3,
                  fontSize: { xs: '2.5rem', md: '3.5rem' }
                }}
              >
                فروشگاه آنلاین
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: 4,
                  opacity: 0.9,
                  lineHeight: 1.8
                }}
              >
                بهترین محصولات را با بهترین قیمت از ما بخواهید.
                تضمین کیفیت و اصالت کالا با ما.
              </Typography>
              <Button
                component={Link}
                to="/products"
                variant="contained"
                size="large"
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'grey.100'
                  },
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem'
                }}
              >
                مشاهده محصولات
              </Button>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box
                component="img"
                src="/hero-image.png"
                alt="Hero"
                sx={{
                  width: '100%',
                  maxWidth: 500,
                  height: 'auto'
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  height: '100%',
                  bgcolor: 'transparent',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)'
                  }
                }}
              >
                <Box sx={{ color: 'primary.main', mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: 'grey.100',
          py: 8,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" gutterBottom>
            آماده خرید هستید؟
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph>
            همین حالا خرید خود را شروع کنید و از تخفیف‌های ویژه ما بهره‌مند شوید.
          </Typography>
          <Button
            component={Link}
            to="/products"
            variant="contained"
            size="large"
            sx={{
              mt: 2,
              px: 4,
              py: 1.5,
              fontSize: '1.1rem'
            }}
          >
            مشاهده همه محصولات
          </Button>
        </Container>
      </Box>
    </Box>
  );
}

export default Home; 