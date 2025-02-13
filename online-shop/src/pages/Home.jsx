import { Container, Typography, Button, Box } from '@mui/material';
import Slider from 'react-slick';
import { Link } from 'react-router-dom';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const carouselItems = [
  {
    id: 1,
    image: '/carousel/slide1.jpg',
    title: 'محصولات جدید',
    description: 'جدیدترین محصولات ما را مشاهده کنید',
    link: '/products'
  },
  {
    id: 2,
    image: '/carousel/slide2.jpg',
    title: 'تخفیف ویژه',
    description: 'تا 30% تخفیف در محصولات منتخب',
    link: '/products'
  },
  {
    id: 3,
    image: '/carousel/slide3.jpg',
    title: 'پیشنهاد ویژه',
    description: 'بهترین محصولات با قیمت استثنایی',
    link: '/products'
  },
  {
    id: 4,
    image: '/carousel/slide4.jpg',
    title: 'فروش ویژه',
    description: 'فرصت های محدود خرید',
    link: '/products'
  },
  {
    id: 5,
    image: '/carousel/slide5.jpg',
    title: 'محصولات پرفروش',
    description: 'پرفروش ترین محصولات ما',
    link: '/products'
  }
];

function Home() {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    rtl: true
  };

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Box sx={{ mb: 4 }}>
        {/* <Slider {...settings}>
          {carouselItems.map((item) => (
            <Box key={item.id} sx={{ position: 'relative', height: '500px' }}>
              <Box
                component="img"
                src={item.image}
                alt={item.title}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 4,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                  color: 'white',
                  textAlign: 'center'
                }}
              >
                <Typography variant="h4" component="h2" gutterBottom>
                  {item.title}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {item.description}
                </Typography>
                <Button
                  component={Link}
                  to={item.link}
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{ mt: 2 }}
                >
                  مشاهده محصولات
                </Button>
              </Box>
            </Box>
          ))}
        </Slider> */}
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          به فروشگاه آنلاین ما خوش آمدید
        </Typography>
        <Typography variant="body1" align="center" paragraph>
          بهترین محصولات را با بهترین قیمت از ما بخواهید
        </Typography>
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button
            component={Link}
            to="/products"
            variant="contained"
            color="primary"
            size="large"
          >
            مشاهده همه محصولات
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

export default Home; 