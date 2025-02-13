import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Grid, Typography, Button, Box, TextField, Alert } from '@mui/material';
import axios from 'axios';

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
        const response = await axios.get(`http://localhost:3000/api/products/${id}`);
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
      const response = await axios.post('http://localhost:3000/api/orders', {
        productId: product.id,
        quantity: quantity
      });
      
      if (response.data.success) {
        setOrderSuccess(true);
        // Redirect to payment page or show payment button
        window.location.href = response.data.paymentUrl;
      }
    } catch (err) {
      setError('خطا در ثبت سفارش');
    }
  };

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

  if (!product) {
    return (
      <Container>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>محصول مورد نظر یافت نشد</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Box
            component="img"
            src={`http://localhost:3000/uploads/images/${product.imagePath}`}
            alt={product.name}
            sx={{
              width: '100%',
              height: 'auto',
              borderRadius: 2,
              boxShadow: 3
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h4" component="h1" gutterBottom>
            {product.name}
          </Typography>
          <Typography variant="body1" paragraph>
            {product.description}
          </Typography>
          <Typography variant="h5" color="primary" gutterBottom>
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
            />
          </Box>

          {orderSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              سفارش شما با موفقیت ثبت شد
            </Alert>
          )}

          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            onClick={handleOrder}
            disabled={product.availableUnits === 0}
          >
            {product.availableUnits === 0 ? 'ناموجود' : 'ثبت سفارش'}
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
}

export default ProductDetail; 