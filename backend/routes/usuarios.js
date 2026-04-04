const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const SECRET = 'casareflexion_secret_2026';

// POST /api/usuarios/registro
router.post('/registro', async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  // Verificar si el email ya existe
  const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
  if (existe) {
    return res.status(400).json({ error: 'El correo ya está registrado' });
  }

  // Encriptar contraseña
  const hash = await bcrypt.hash(password, 10);

  // Guardar usuario
  const resultado = db.prepare(`
    INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)
  `).run(nombre, email, hash);

  const usuario = db.prepare('SELECT id, nombre, email, rol FROM usuarios WHERE id = ?').get(resultado.lastInsertRowid);

  // Generar token
  const token = jwt.sign({ id: usuario.id, email: usuario.email, rol: usuario.rol }, SECRET, { expiresIn: '7d' });

  res.status(201).json({ usuario, token });
});

// POST /api/usuarios/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  // Buscar usuario
  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  if (!usuario) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  }

  // Verificar contraseña
  const valida = await bcrypt.compare(password, usuario.password);
  if (!valida) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  }

  // Generar token
  const token = jwt.sign({ id: usuario.id, email: usuario.email, rol: usuario.rol }, SECRET, { expiresIn: '7d' });

  res.json({
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    token
  });
});

// GET /api/usuarios/perfil — obtener perfil (requiere token)
router.get('/perfil', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    const datos = jwt.verify(token, SECRET);
    const usuario = db.prepare('SELECT id, nombre, email, rol FROM usuarios WHERE id = ?').get(datos.id);
    res.json(usuario);
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
});

module.exports = router;
