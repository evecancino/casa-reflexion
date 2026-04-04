const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const db = require('./database');  // ← solo agregas esta línea
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../..')));

// Ruta de prueba
app.get('/api/ping', (req, res) => {
  res.json({ mensaje: '✅ Servidor Casa Reflexión funcionando!' });
});

// Rutas
const productosRoutes = require('./routes/productos');
app.use('/api/productos', productosRoutes);

const usuariosRoutes = require('./routes/usuarios');
app.use('/api/usuarios', usuariosRoutes);

const carritoRoutes = require('./routes/carrito');
app.use('/api/carrito', carritoRoutes);

const pagosRoutes = require('./routes/pagos');
app.use('/api/pagos', pagosRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🏡 Servidor corriendo en http://localhost:${PORT}`);
});
