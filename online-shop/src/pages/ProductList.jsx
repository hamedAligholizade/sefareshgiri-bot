import { useState, useEffect } from 'react';
import { Container, Grid, Card, CardMedia, CardContent, Typography, CardActions, Button, Box, Fade } from '@mui/material';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/api/products');
        setProducts(response.data || []);
        setLoading(false);
      } catch (err) {
        setError('خطا در دریافت محصولات');
        setLoading(false);
        setProducts([]);
      }
    };

    fetchProducts();
  }, []);

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

  if (!Array.isArray(products) || products.length === 0) {
    return (
      <Box sx={{ 
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="h5" color="text.secondary">
          در حال حاضر محصولی موجود نیست
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 6,
          mb: 6
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              textAlign: 'center'
            }}
          >
            محصولات ما
          </Typography>
          <Typography
            variant="h6"
            sx={{
              textAlign: 'center',
              opacity: 0.9
            }}
          >
            بهترین محصولات را با بهترین قیمت از ما بخواهید
          </Typography>
        </Container>
      </Box>

      {/* Products Grid */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Grid container spacing={4}>
          {products.map((product, index) => (
            <Grid item key={product.id} xs={12} sm={6} md={4}>
              <Fade in={true} timeout={500} style={{ transitionDelay: `${index * 100}ms` }}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 6
                    }
                  }}
                >
                  <CardMedia
                    component="img"
                    height="300"
                    image={`/uploads/images/${product.imagePath}`}
                    alt={product.name}
                    sx={{
                      objectFit: 'cover'
                    }}
                  />
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Typography gutterBottom variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {product.description}
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                      {Number(product.price).toLocaleString('fa-IR')} تومان
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      component={Link}
                      to={`/product/${product.id}`}
                      variant="contained"
                      fullWidth
                      startIcon={<ShoppingCartIcon />}
                      sx={{
                        py: 1,
                        fontSize: '1rem'
                      }}
                    >
                      مشاهده و خرید
                    </Button>
                  </CardActions>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

export default ProductList; 