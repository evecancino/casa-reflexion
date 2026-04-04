const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');

const SECRET = 'casareflexion_secret_2026';

// Middleware para verificar token
function verificarToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Debes iniciar sesión' });

  try {
    req.usuario = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// GET /api/carrito — obtener carrito del usuario
router.get('/', verificarToken, (req, res) => {
  const items = db.prepare(`
    SELECT c.id, c.cantidad, p.id as producto_id, p.nombre, p.precio, p.emoji, p.color_fondo
    FROM carrito c
    JOIN productos p ON c.producto_id = p.id
    WHERE c.usuario_id = ?
  `).all(req.usuario.id);

  const total = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  res.json({ items, total });
});

// POST /api/carrito — agregar producto al carrito
router.post('/', verificarToken, (req, res) => {
  const { producto_id } = req.body;

  if (!producto_id) return res.status(400).json({ error: 'producto_id es obligatorio' });

  // Verificar si el producto ya está en el carrito
  const existe = db.prepare('SELECT id, cantidad FROM carrito WHERE usuario_id = ? AND producto_id = ?').get(req.usuario.id, producto_id);

  if (existe) {
    // Aumentar cantidad
    db.prepare('UPDATE carrito SET cantidad = cantidad + 1 WHERE id = ?').run(existe.id);
  } else {
    // Agregar nuevo
    db.prepare('INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (?, ?, 1)').run(req.usuario.id, producto_id);
  }

  res.json({ mensaje: 'Producto agregado al carrito' });
});

// PUT /api/carrito/:id — cambiar cantidad
router.put('/:id', verificarToken, (req, res) => {
  const { cantidad } = req.body;

  if (cantidad < 1) return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });

  db.prepare('UPDATE carrito SET cantidad = ? WHERE id = ? AND usuario_id = ?').run(cantidad, req.params.id, req.usuario.id);
  res.json({ mensaje: 'Cantidad actualizada' });
});

// DELETE /api/carrito/:id — eliminar producto del carrito
router.delete('/:id', verificarToken, (req, res) => {
  db.prepare('DELETE FROM carrito WHERE id = ? AND usuario_id = ?').run(req.params.id, req.usuario.id);
  res.json({ mensaje: 'Producto eliminado del carrito' });
});

// DELETE /api/carrito — vaciar carrito completo
router.delete('/', verificarToken, (req, res) => {
  db.prepare('DELETE FROM carrito WHERE usuario_id = ?').run(req.usuario.id);
  res.json({ mensaje: 'Carrito vaciado' });
});

module.exports = router;
