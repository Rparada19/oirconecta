import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Chip,
  Rating,
  IconButton,
  Badge,
  InputAdornment
} from '@mui/material';
import {
  Search,
  ShoppingCart,
  Favorite,
  FavoriteBorder,
  Clear
} from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';

const EcommercePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]);

  const productos = [
    {
      id: 1,
      name: 'Audífono Phonak Audeo Paradise',
      price: 2500000,
      originalPrice: 2800000,
      rating: 4.8,
      reviews: 124,
      image: '/placeholder-audifono-1.jpg',
      category: 'audifonos',
      brand: 'Phonak',
      features: ['Bluetooth', 'Resistente al agua', 'Batería recargable'],
      inStock: true
    },
    {
      id: 2,
      name: 'Audífono Oticon More',
      price: 2200000,
      originalPrice: 2500000,
      rating: 4.6,
      reviews: 89,
      image: '/placeholder-audifono-2.jpg',
      category: 'audifonos',
      brand: 'Oticon',
      features: ['BrainHearing™', 'Conectividad inalámbrica', 'Diseño discreto'],
      inStock: true
    },
    {
      id: 3,
      name: 'Pilas para Audífonos Rayovac',
      price: 25000,
      originalPrice: 30000,
      rating: 4.5,
      reviews: 256,
      image: '/placeholder-pilas.jpg',
      category: 'accesorios',
      brand: 'Rayovac',
      features: ['Larga duración', 'Tamaño 13', 'Pack de 6'],
      inStock: true
    },
    {
      id: 4,
      name: 'Limpiador para Audífonos',
      price: 45000,
      originalPrice: 55000,
      rating: 4.7,
      reviews: 78,
      image: '/placeholder-limpiador.jpg',
      category: 'accesorios',
      brand: 'Oticon',
      features: ['Limpieza profunda', 'Seguro para dispositivos', 'Kit completo'],
      inStock: true
    },
    {
      id: 5,
      name: 'Estuche Protector para Audífonos',
      price: 35000,
      originalPrice: 40000,
      rating: 4.4,
      reviews: 92,
      image: '/placeholder-estuche.jpg',
      category: 'accesorios',
      brand: 'Universal',
      features: ['Protección contra humedad', 'Diseño compacto', 'Material resistente'],
      inStock: true
    },
    {
      id: 6,
      name: 'Audífono Starkey Evolv AI',
      price: 2800000,
      originalPrice: 3200000,
      rating: 4.9,
      reviews: 67,
      image: '/placeholder-audifono-3.jpg',
      category: 'audifonos',
      brand: 'Starkey',
      features: ['Tecnología Evolv AI', 'Conectividad Livio', 'Diseño personalizado'],
      inStock: false
    }
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleAddToWishlist = (productId) => {
    if (wishlist.includes(productId)) {
      setWishlist(wishlist.filter(id => id !== productId));
    } else {
      setWishlist([...wishlist, productId]);
    }
  };

  const handleAddToCart = (product) => {
    setCart([...cart, product]);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategory('');
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = searchTerm || category;

  const filteredProducts = useMemo(() => {
    return productos.filter(product => {
      const matchesSearch = !searchTerm ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !category || product.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, category]);

  return (
    <>
      <Helmet>
        <title>Tienda de Audífonos - OirConecta | Productos de Calidad</title>
        <meta name="description" content="Encuentra los mejores audífonos y accesorios en nuestra tienda. Marcas reconocidas como Phonak, Oticon y Starkey. Envío gratis en Colombia." />
        <meta name="keywords" content="audífonos, tienda, Phonak, Oticon, Starkey, accesorios, Colombia" />
        <link rel="canonical" href="https://oirconecta.com/ecommerce" />
      </Helmet>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ height: '80px' }}></div>

        <Container maxWidth="lg" sx={{ py: 8, flex: 1 }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{
            textAlign: 'center',
            fontWeight: 700,
            color: '#085946',
            mb: 6
          }}>
            Tienda de Audífonos
          </Typography>

          <Typography variant="h5" component="p" sx={{
            textAlign: 'center',
            color: '#6b7280',
            mb: 8,
            maxWidth: '800px',
            mx: 'auto'
          }}>
            Descubre nuestra selección de audífonos de alta calidad y accesorios esenciales.
            Marcas reconocidas mundialmente con garantía y soporte técnico especializado.
          </Typography>

          {/* Filtros y Búsqueda */}
          <Box sx={{ mb: 6 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    label="Categoría"
                  >
                    <MenuItem value="">Todas las categorías</MenuItem>
                    <MenuItem value="audifonos">Audífonos</MenuItem>
                    <MenuItem value="accesorios">Accesorios</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {hasActiveFilters && (
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleClearFilters}
                    startIcon={<Clear />}
                    sx={{
                      borderColor: '#dc3545',
                      color: '#dc3545',
                      '&:hover': {
                        borderColor: '#dc3545',
                        backgroundColor: '#dc3545',
                        color: 'white'
                      }
                    }}
                  >
                    Borrar filtros
                  </Button>
                </Grid>
              )}

              <Grid item xs={12} md={hasActiveFilters ? 2 : 4}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {filteredProducts.length} productos encontrados
                  </Typography>
                  <Badge badgeContent={cart.length} color="primary">
                    <IconButton>
                      <ShoppingCart />
                    </IconButton>
                  </Badge>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Productos */}
          <Grid container spacing={4}>
            {filteredProducts.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={product.image}
                    alt={product.name}
                    sx={{ objectFit: 'cover' }}
                  />

                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Chip label={product.brand} size="small" color="primary" />
                      <IconButton
                        size="small"
                        onClick={() => handleAddToWishlist(product.id)}
                        color={wishlist.includes(product.id) ? 'error' : 'default'}
                      >
                        {wishlist.includes(product.id) ? <Favorite /> : <FavoriteBorder />}
                      </IconButton>
                    </Box>

                    <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                      {product.name}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Rating value={product.rating} precision={0.1} size="small" readOnly />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        ({product.reviews})
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      {product.features.map((feature, index) => (
                        <Chip
                          key={index}
                          label={feature}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h5" component="span" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {formatPrice(product.price)}
                      </Typography>
                      {product.originalPrice > product.price && (
                        <Typography
                          variant="body2"
                          component="span"
                          sx={{
                            textDecoration: 'line-through',
                            color: 'text.secondary',
                            ml: 1
                          }}
                        >
                          {formatPrice(product.originalPrice)}
                        </Typography>
                      )}
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      disabled={!product.inStock}
                      onClick={() => handleAddToCart(product)}
                      sx={{
                        bgcolor: '#085946',
                        '&:hover': { bgcolor: '#272F50' }
                      }}
                    >
                      {product.inStock ? 'Agregar al carrito' : 'Agotado'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {filteredProducts.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h5" color="text.secondary" gutterBottom>
                No se encontraron productos
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Intenta ajustar tus filtros de búsqueda
              </Typography>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                startIcon={<Clear />}
                sx={{
                  borderColor: '#dc3545',
                  color: '#dc3545',
                  '&:hover': {
                    borderColor: '#dc3545',
                    backgroundColor: '#dc3545',
                    color: 'white'
                  }
                }}
              >
                Borrar filtros
              </Button>
            </Box>
          )}
        </Container>

        <Footer />
      </div>
    </>
  );
};

export default EcommercePage; 