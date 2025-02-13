import { useState, useEffect } from 'react';
import { Container, Grid, Card, CardMedia, CardContent, Typography, CardActions, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import axios from 'axios';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/products');
        setProducts(response.data);
        setLoading(false);
      } catch (err) {
        setError('خطا در دریافت محصولات');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <Container>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>در حال بارگذاری...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        محصولات
      </Typography>
      <Grid container spacing={4}>
        {products.map((product) => (
          <Grid item key={product.id} xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="200"
                image={`http://localhost:3000/uploads/images/${product.imagePath}`}
                alt={product.name}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h2">
                  {product.name}
                </Typography>
                <Typography>
                  {product.description}
                </Typography>
                <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                  {Number(product.price).toLocaleString('fa-IR')} تومان
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  component={Link}
                  to={`/product/${product.id}`}
                  size="small"
                  color="primary"
                  fullWidth
                >
                  مشاهده جزئیات
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default ProductList; 