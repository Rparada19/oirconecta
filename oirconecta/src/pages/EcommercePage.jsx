import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { getApiBaseUrl } from '../utils/apiBaseUrl';
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
import ShopCartDialog from '../components/shop/ShopCartDialog';

// Accesorios de la tienda OírConecta. NUNCA audífonos (prohibido por web en Colombia).
const CATEGORIAS = [
  { value: 'BATERIAS', label: 'Baterías' },
  { value: 'FILTROS', label: 'Filtros' },
  { value: 'OLIVAS', label: 'Olivas' },
  { value: 'CONECTIVIDAD', label: 'Conectividad' },
  { value: 'ACCESORIOS', label: 'Accesorios' },
];
const categoriaLabel = (v) => CATEGORIAS.find((c) => c.value === v)?.label || v;

const EcommercePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/shop/products`);
        const json = await res.json();
        if (active) setProductos(json?.data || []);
      } catch {
        if (active) setProductos([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

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
    setCart((prev) => {
      const existing = prev.find((it) => it.id === product.id);
      if (existing) {
        return prev.map((it) => (it.id === product.id ? { ...it, cantidad: it.cantidad + 1 } : it));
      }
      return [...prev, { ...product, cantidad: 1 }];
    });
    setCartOpen(true);
  };

  const cartCount = cart.reduce((s, it) => s + it.cantidad, 0);

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategory('');
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = searchTerm || category;

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return productos.filter(product => {
      const matchesSearch = !term ||
        (product.nombre || '').toLowerCase().includes(term) ||
        (product.marca || '').toLowerCase().includes(term);
      const matchesCategory = !category || product.categoria === category;
      return matchesSearch && matchesCategory;
    });
  }, [productos, searchTerm, category]);

  // Tienda real: Product + Offer (precio COP, disponibilidad). Markup de ficha de
  // comerciante válido para Google ahora que la venta está activa.
  const catalogJsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Accesorios auditivos — Tienda OírConecta',
    itemListElement: productos.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.nombre,
        ...(p.marca ? { brand: { '@type': 'Brand', name: p.marca } } : {}),
        ...(p.sku ? { sku: p.sku } : {}),
        category: categoriaLabel(p.categoria),
        ...(p.descripcion ? { description: p.descripcion } : {}),
        ...(p.imageUrls && p.imageUrls.length ? { image: p.imageUrls } : {}),
        offers: {
          '@type': 'Offer',
          price: p.precio,
          priceCurrency: 'COP',
          availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          url: 'https://oirconecta.com/ecommerce',
        },
      },
    })),
  }), [productos]);

  return (
    <>
      <Helmet>
        <title>Tienda OírConecta | Baterías, filtros, olivas y accesorios auditivos</title>
        <meta name="description" content="Tienda de accesorios para audífonos: baterías de todas las marcas, filtros, olivas y accesorios de conectividad. Envíos en Colombia." />
        <meta name="keywords" content="baterías audífonos, filtros, olivas, accesorios auditivos, conectividad, Colombia" />
        <link rel="canonical" href="https://oirconecta.com/ecommerce" />
        <script type="application/ld+json">{JSON.stringify(catalogJsonLd)}</script>
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
            Tienda OírConecta
          </Typography>

          <Typography variant="h5" component="p" sx={{
            textAlign: 'center',
            color: '#6b7280',
            mb: 8,
            maxWidth: '800px',
            mx: 'auto'
          }}>
            Baterías de todas las marcas, filtros, olivas y accesorios de conectividad para tus audífonos. Envíos en Colombia.
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
                    {CATEGORIAS.map((c) => (
                      <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                    ))}
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
                  <Badge badgeContent={cartCount} color="primary">
                    <IconButton onClick={() => setCartOpen(true)}>
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
                    image={(product.imageUrls && product.imageUrls[0]) || '/logo.png'}
                    alt={product.nombre}
                    sx={{ objectFit: 'cover' }}
                  />

                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Chip label={product.marca || categoriaLabel(product.categoria)} size="small" color="primary" />
                      <IconButton
                        size="small"
                        onClick={() => handleAddToWishlist(product.id)}
                        color={wishlist.includes(product.id) ? 'error' : 'default'}
                      >
                        {wishlist.includes(product.id) ? <Favorite /> : <FavoriteBorder />}
                      </IconButton>
                    </Box>

                    <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                      {product.nombre}
                    </Typography>

                    {product.descripcion && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {product.descripcion}
                      </Typography>
                    )}

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h5" component="span" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {formatPrice(product.precio)}
                      </Typography>
                      {product.precioAntes != null && product.precioAntes > product.precio && (
                        <Typography
                          variant="body2"
                          component="span"
                          sx={{
                            textDecoration: 'line-through',
                            color: 'text.secondary',
                            ml: 1
                          }}
                        >
                          {formatPrice(product.precioAntes)}
                        </Typography>
                      )}
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      disabled={product.stock <= 0}
                      onClick={() => handleAddToCart(product)}
                      sx={{
                        bgcolor: '#085946',
                        '&:hover': { bgcolor: '#272F50' }
                      }}
                    >
                      {product.stock > 0 ? 'Agregar al carrito' : 'Agotado'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {!loading && filteredProducts.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h5" color="text.secondary" gutterBottom>
                {productos.length === 0 ? 'Pronto tendremos productos disponibles' : 'No se encontraron productos'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {productos.length === 0 ? 'Estamos cargando el catálogo.' : 'Intenta ajustar tus filtros de búsqueda'}
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

        <ShopCartDialog open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} setCart={setCart} />

        <Footer />
      </div>
    </>
  );
};

export default EcommercePage; 