const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('../database-pg');

const SECRET = process.env.JWT_SECRET || 'casareflexion_secret_2026';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../img/productos'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `producto-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const tipos = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (tipos.includes(ext)) cb(null, true);
    else cb(new Error('Solo se permiten imágenes jpg, png o webp'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

function verificarAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try {
    const datos = jwt.verify(token, SECRET);
    if (datos.rol !== 'admin') return res.status(403).json({ error: 'Se requiere rol de administrador' });
    req.usuario = datos;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// GET /api/admin/productos
router.get('/productos', verificarAdmin, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM productos ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// POST /api/admin/productos
router.post('/productos', verificarAdmin, upload.single('foto'), async (req, res) => {
  const { nombre, descripcion, precio, categoria, emoji, destacado, stock } = req.body;
  if (!nombre || !precio || !categoria) {
    return res.status(400).json({ error: 'Nombre, precio y categoría son obligatorios' });
  }
  const foto = req.file ? `/img/productos/${req.file.filename}` : null;
  try {
    const { rows } = await db.query(
      'INSERT INTO productos (nombre, descripcion, precio, categoria, emoji, foto, destacado, stock) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [nombre, descripcion, precio, categoria, emoji || '🏠', foto, destacado || 0, stock || 10]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// PUT /api/admin/productos/:id
router.put('/productos/:id', verificarAdmin, upload.single('foto'), async (req, res) => {
  const { nombre, descripcion, precio, categoria, emoji, destacado, stock } = req.body;
  try {
    const existe = await db.query('SELECT foto FROM productos WHERE id = $1', [req.params.id]);
    if (existe.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    const foto = req.file ? `/img/productos/${req.file.filename}` : existe.rows[0].foto;
    const { rows } = await db.query(
      'UPDATE productos SET nombre=$1, descripcion=$2, precio=$3, categoria=$4, emoji=$5, foto=$6, destacado=$7, stock=$8 WHERE id=$9 RETURNING *',
      [nombre, descripcion, precio, categoria, emoji, foto, destacado, stock, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// DELETE /api/admin/productos/:id
router.delete('/productos/:id', verificarAdmin, async (req, res) => {
  try {
    const { rows } = await db.query('DELETE FROM productos WHERE id=$1 RETURNING id', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// GET /api/admin/usuarios
router.get('/usuarios', verificarAdmin, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, nombre, email, rol, creado_en FROM usuarios ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// PUT /api/admin/usuarios/:id/rol
router.put('/usuarios/:id/rol', verificarAdmin, async (req, res) => {
  const { rol } = req.body;
  if (!['admin', 'cliente'].includes(rol)) return res.status(400).json({ error: 'Rol inválido' });
  try {
    await db.query('UPDATE usuarios SET rol = $1 WHERE id = $2', [rol, req.params.id]);
    res.json({ mensaje: 'Rol actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
});

module.exports = router;