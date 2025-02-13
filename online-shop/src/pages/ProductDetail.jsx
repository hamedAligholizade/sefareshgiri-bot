import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Grid, Typography, Button, Box, TextField, Alert, Paper, Fade, Divider } from '@mui/material';
import axios from 'axios';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VerifiedIcon from '@mui/icons-material/Verified';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`/api/products/${id}`);
        setProduct(response.data);
        setLoading(false);
      } catch (err) {
        setError('خطا در دریافت اطلاعات محصول');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleQuantityChange = (event) => {
    const value = parseInt(event.target.value);
    if (value > 0 && value <= product.availableUnits) {
      setQuantity(value);
    }
  };

  const handleOrder = async () => {
    try {
      const response = await axios.post('/api/orders', {
        productId: product.id,
        quantity: quantity
      });
      
      if (response.data.success) {
        setOrderSuccess(true);
        window.location.href = response.data.paymentUrl;
      }
    } catch (err) {
      setError('خطا در ثبت سفارش');
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="h5" color="text.secondary">
          در حال بارگذاری...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="h5" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ 
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="h5" color="text.secondary">
          محصول مورد نظر یافت نشد
        </Typography>
      </Box>
    );
  }

  const features = [
    {
      icon: <LocalShippingIcon sx={{ fontSize: 40 }} />,
      title: 'ارسال سریع',
      description: 'تحویل اکسپرس'
    },
    {
      icon: <VerifiedIcon sx={{ fontSize: 40 }} />,
      title: 'ضمانت اصالت',
      description: 'تضمین کیفیت محصول'
    },
    {
      icon: <SupportAgentIcon sx={{ fontSize: 40 }} />,
      title: 'پشتیبانی',
      description: 'پاسخگویی ۲۴ ساعته'
    }
  ];

  return (
    <Box sx={{ bgcolor: '#f5f5f5', py: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Fade in={true} timeout={500}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'white', borderRadius: 2 }}>
                <Box
                  component="img"
                  src={`/uploads/images/${product.imagePath}`}
                  alt={product.name}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: 2,
                    mb: 2
                  }}
                />
              </Paper>
            </Fade>
          </Grid>
          <Grid item xs={12} md={6}>
            <Fade in={true} timeout={500} style={{ transitionDelay: '200ms' }}>
              <Paper elevation={0} sx={{ p: 4, bgcolor: 'white', borderRadius: 2 }}>
                <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {product.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                  {product.description}
                </Typography>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h4" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {Number(product.price).toLocaleString('fa-IR')} تومان
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  موجودی: {product.availableUnits} عدد
                </Typography>
                
                <Box sx={{ my: 3 }}>
                  <TextField
                    type="number"
                    label="تعداد"
                    value={quantity}
                    onChange={handleQuantityChange}
                    inputProps={{ min: 1, max: product.availableUnits }}
                    fullWidth
                    variant="outlined"
                  />
                </Box>

                {orderSuccess && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    سفارش شما با موفقیت ثبت شد
                  </Alert>
                )}

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleOrder}
                  disabled={product.availableUnits === 0}
                  startIcon={<ShoppingCartIcon />}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem'
                  }}
                >
                  {product.availableUnits === 0 ? 'ناموجود' : 'ثبت سفارش'}
                </Button>
              </Paper>
            </Fade>
          </Grid>
        </Grid>

        {/* Features Section */}
        <Grid container spacing={3} sx={{ mt: 4 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Fade in={true} timeout={500} style={{ transitionDelay: `${400 + index * 100}ms` }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    bgcolor: 'white',
                    borderRadius: 2,
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
              </Fade>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

export default ProductDetail; 