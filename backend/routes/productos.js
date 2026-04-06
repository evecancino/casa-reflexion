const express = require('express');
const router = express.Router();
const db = require('../database-pg');

// GET /api/productos
router.get('/', async (req, res) => {
  const { buscar, categoria, orden } = req.query;

  let query = 'SELECT * FROM productos WHERE 1=1';
  const params = [];
  let i = 1;

  if (buscar) {
    query += ` AND (nombre ILIKE $${i} OR descripcion ILIKE $${i} OR categoria ILIKE $${i})`;
    params.push(`%${buscar}%`);
    i++;
  }

  if (categoria) {
    query += ` AND categoria = $${i}`;
    params.push(categoria);
    i++;
  }

  if (orden === 'asc') {
    query += ' ORDER BY precio ASC';
  } else if (orden === 'desc') {
    query += ' ORDER BY precio DESC';
  } else {
    query += ' ORDER BY destacado DESC, id ASC';
  }

  try {
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});
// GET /api/productos/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM productos WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// POST /api/productos
router.post('/', async (req, res) => {
  const { nombre, descripcion, precio, categoria, emoji, color_fondo, destacado, stock } = req.body;
  if (!nombre || !precio || !categoria) {
    return res.status(400).json({ error: 'Nombre, precio y categoría son obligatorios' });
  }
  try {
    const { rows } = await db.query(
      'INSERT INTO productos (nombre, descripcion, precio, categoria, emoji, color_fondo, destacado, stock) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [nombre, descripcion, precio, categoria, emoji || '🏠', color_fondo || '#f0e8d8', destacado || 0, stock || 10]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// PUT /api/productos/:id
router.put('/:id', async (req, res) => {
  const { nombre, descripcion, precio, categoria, emoji, color_fondo, destacado, stock } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE productos SET nombre=$1, descripcion=$2, precio=$3, categoria=$4, emoji=$5, color_fondo=$6, destacado=$7, stock=$8 WHERE id=$9 RETURNING *',
      [nombre, descripcion, precio, categoria, emoji, color_fondo, destacado, stock, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// DELETE /api/productos/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('DELETE FROM productos WHERE id=$1 RETURNING id', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

module.exports = router;