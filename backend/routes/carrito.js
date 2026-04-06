const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database-pg');

const SECRET = process.env.JWT_SECRET || 'casareflexion_secret_2026';

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

// GET /api/carrito
router.get('/', verificarToken, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT c.id, c.cantidad, p.id as producto_id, p.nombre, p.precio, p.emoji, p.color_fondo
      FROM carrito c
      JOIN productos p ON c.producto_id = p.id
      WHERE c.usuario_id = $1
    `, [req.usuario.id]);
    const total = rows.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    res.json({ items: rows, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener carrito' });
  }
});

// POST /api/carrito
router.post('/', verificarToken, async (req, res) => {
  const { producto_id } = req.body;
  if (!producto_id) return res.status(400).json({ error: 'producto_id es obligatorio' });
  try {
    const existe = await db.query('SELECT id, cantidad FROM carrito WHERE usuario_id = $1 AND producto_id = $2', [req.usuario.id, producto_id]);
    if (existe.rows.length > 0) {
      await db.query('UPDATE carrito SET cantidad = cantidad + 1 WHERE id = $1', [existe.rows[0].id]);
    } else {
      await db.query('INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES ($1, $2, 1)', [req.usuario.id, producto_id]);
    }
    res.json({ mensaje: 'Producto agregado al carrito' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al agregar al carrito' });
  }
});

// PUT /api/carrito/:id
router.put('/:id', verificarToken, async (req, res) => {
  const { cantidad } = req.body;
  if (cantidad < 1) return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
  try {
    await db.query('UPDATE carrito SET cantidad = $1 WHERE id = $2 AND usuario_id = $3', [cantidad, req.params.id, req.usuario.id]);
    res.json({ mensaje: 'Cantidad actualizada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar cantidad' });
  }
});

// DELETE /api/carrito/:id
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    await db.query('DELETE FROM carrito WHERE id = $1 AND usuario_id = $2', [req.params.id, req.usuario.id]);
    res.json({ mensaje: 'Producto eliminado del carrito' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// DELETE /api/carrito
router.delete('/', verificarToken, async (req, res) => {
  try {
    await db.query('DELETE FROM carrito WHERE usuario_id = $1', [req.usuario.id]);
    res.json({ mensaje: 'Carrito vaciado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al vaciar carrito' });
  }
});

module.exports = router;