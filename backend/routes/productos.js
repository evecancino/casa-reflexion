const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/productos
// Parámetros opcionales: ?buscar=espejo&categoria=espejos&orden=asc|desc
router.get('/', (req, res) => {
  const { buscar, categoria, orden } = req.query;

  let query = 'SELECT * FROM productos WHERE 1=1';
  const params = [];

  // Filtro por búsqueda
if (buscar) {
  query += ' AND (nombre LIKE ? OR descripcion LIKE ? OR categoria LIKE ?)';
  params.push(`%${buscar}%`, `%${buscar}%`, `%${buscar}%`);
}

  // Filtro por categoría
  if (categoria) {
    query += ' AND categoria = ?';
    params.push(categoria);
  }

  // Ordenar por precio
  if (orden === 'asc') {
    query += ' ORDER BY precio ASC';
  } else if (orden === 'desc') {
    query += ' ORDER BY precio DESC';
  } else {
    query += ' ORDER BY destacado DESC, id ASC';
  }

  const productos = db.prepare(query).all(...params);
  res.json(productos);
});

// GET /api/productos/:id — obtener un producto por ID
router.get('/:id', (req, res) => {
  const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(producto);
});

// POST /api/productos — agregar producto (admin)
router.post('/', (req, res) => {
  const { nombre, descripcion, precio, categoria, emoji, color_fondo, destacado, stock } = req.body;

  if (!nombre || !precio || !categoria) {
    return res.status(400).json({ error: 'Nombre, precio y categoría son obligatorios' });
  }

  const resultado = db.prepare(`
    INSERT INTO productos (nombre, descripcion, precio, categoria, emoji, color_fondo, destacado, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(nombre, descripcion, precio, categoria, emoji || '🏠', color_fondo || '#f0e8d8', destacado || 0, stock || 10);

  const nuevo = db.prepare('SELECT * FROM productos WHERE id = ?').get(resultado.lastInsertRowid);
  res.status(201).json(nuevo);
});

// PUT /api/productos/:id — editar producto
router.put('/:id', (req, res) => {
  const { nombre, descripcion, precio, categoria, emoji, color_fondo, destacado, stock } = req.body;

  const existe = db.prepare('SELECT id FROM productos WHERE id = ?').get(req.params.id);
  if (!existe) return res.status(404).json({ error: 'Producto no encontrado' });

  db.prepare(`
    UPDATE productos SET nombre=?, descripcion=?, precio=?, categoria=?, emoji=?, color_fondo=?, destacado=?, stock=?
    WHERE id=?
  `).run(nombre, descripcion, precio, categoria, emoji, color_fondo, destacado, stock, req.params.id);

  const actualizado = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id);
  res.json(actualizado);
});

// DELETE /api/productos/:id — eliminar producto
router.delete('/:id', (req, res) => {
  const existe = db.prepare('SELECT id FROM productos WHERE id = ?').get(req.params.id);
  if (!existe) return res.status(404).json({ error: 'Producto no encontrado' });

  db.prepare('DELETE FROM productos WHERE id = ?').run(req.params.id);
  res.json({ mensaje: 'Producto eliminado correctamente' });
});

module.exports = router;
