const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('../database');

const SECRET = 'casareflexion_secret_2026';

// Configuración de multer para subir imágenes
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
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB máximo
});

// Middleware para verificar admin
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

// GET /api/admin/productos — listar todos los productos
router.get('/productos', verificarAdmin, (req, res) => {
  const productos = db.prepare('SELECT * FROM productos ORDER BY id DESC').all();
  res.json(productos);
});

// POST /api/admin/productos — agregar producto con foto
router.post('/productos', verificarAdmin, upload.single('foto'), (req, res) => {
  const { nombre, descripcion, precio, categoria, emoji, destacado, stock } = req.body;

  if (!nombre || !precio || !categoria) {
    return res.status(400).json({ error: 'Nombre, precio y categoría son obligatorios' });
  }

  const foto = req.file ? `/img/productos/${req.file.filename}` : null;

  const resultado = db.prepare(`
    INSERT INTO productos (nombre, descripcion, precio, categoria, emoji, foto, destacado, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(nombre, descripcion, precio, categoria, emoji || '🏠', foto, destacado || 0, stock || 10);

  const nuevo = db.prepare('SELECT * FROM productos WHERE id = ?').get(resultado.lastInsertRowid);
  res.status(201).json(nuevo);
});

// PUT /api/admin/productos/:id — editar producto
router.put('/productos/:id', verificarAdmin, upload.single('foto'), (req, res) => {
  const { nombre, descripcion, precio, categoria, emoji, destacado, stock } = req.body;

  const existe = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id);
  if (!existe) return res.status(404).json({ error: 'Producto no encontrado' });

  const foto = req.file ? `/img/productos/${req.file.filename}` : existe.foto;

  db.prepare(`
    UPDATE productos SET nombre=?, descripcion=?, precio=?, categoria=?, emoji=?, foto=?, destacado=?, stock=?
    WHERE id=?
  `).run(nombre, descripcion, precio, categoria, emoji, foto, destacado, stock, req.params.id);

  const actualizado = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id);
  res.json(actualizado);
});

// DELETE /api/admin/productos/:id — eliminar producto
router.delete('/productos/:id', verificarAdmin, (req, res) => {
  const existe = db.prepare('SELECT id FROM productos WHERE id = ?').get(req.params.id);
  if (!existe) return res.status(404).json({ error: 'Producto no encontrado' });

  db.prepare('DELETE FROM productos WHERE id = ?').run(req.params.id);
  res.json({ mensaje: 'Producto eliminado' });
});

// GET /api/admin/usuarios — listar usuarios
router.get('/usuarios', verificarAdmin, (req, res) => {
  const usuarios = db.prepare('SELECT id, nombre, email, rol, creado_en FROM usuarios ORDER BY id DESC').all();
  res.json(usuarios);
});

// PUT /api/admin/usuarios/:id/rol — cambiar rol de usuario
router.put('/usuarios/:id/rol', verificarAdmin, (req, res) => {
  const { rol } = req.body;
  if (!['admin', 'cliente'].includes(rol)) return res.status(400).json({ error: 'Rol inválido' });

  db.prepare('UPDATE usuarios SET rol = ? WHERE id = ?').run(rol, req.params.id);
  res.json({ mensaje: 'Rol actualizado' });
});

module.exports = router;
