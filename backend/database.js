const Database = require('better-sqlite3');
const path = require('path');

// Crear o conectar a la base de datos
const db = new Database(path.join(__dirname, 'casareflexion.db'));

// Crear tablas si no existen
db.exec(`
  CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio INTEGER NOT NULL,
    categoria TEXT NOT NULL,
    emoji TEXT,
    color_fondo TEXT DEFAULT '#f0e8d8',
    destacado INTEGER DEFAULT 0,
    foto TEXT,
    stock INTEGER DEFAULT 10,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    rol TEXT DEFAULT 'cliente',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS carrito (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad INTEGER DEFAULT 1,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
  );

  CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    total INTEGER NOT NULL,
    estado TEXT DEFAULT 'pendiente',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  );
`);

// Insertar productos de ejemplo si la tabla está vacía
const total = db.prepare('SELECT COUNT(*) as total FROM productos').get();

if (total.total === 0) {
  const insertar = db.prepare(`
    INSERT INTO productos (nombre, descripcion, precio, categoria, emoji, color_fondo, destacado)
    VALUES (@nombre, @descripcion, @precio, @categoria, @emoji, @color_fondo, @destacado)
  `);

  const productos = [
    { nombre: 'Jarrón Siena', descripcion: 'Cerámica artesanal en tono terracota con acabado mate.', precio: 24990, categoria: 'ceramica', emoji: '🏺', color_fondo: '#e8ddd4', destacado: 0 },
    { nombre: 'Maceta Nórdica', descripcion: 'Maceta de concreto con diseño minimalista escandinavo.', precio: 18500, categoria: 'maseteros', emoji: '🪴', color_fondo: '#dce5dc', destacado: 0 },
    { nombre: 'Vela Sándalo & Cedro', descripcion: '80 horas de aroma envolvente con cera de soya natural.', precio: 12990, categoria: 'velas', emoji: '🕯️', color_fondo: '#f0e8d8', destacado: 1 },
    { nombre: 'Espejo Luna Dorado', descripcion: 'Marco de metal dorado satinado, Ø 50 cm, ideal para sala.', precio: 39900, categoria: 'espejos', emoji: '🪞', color_fondo: '#e5e0ec', destacado: 0 },
    { nombre: 'Lámina Botánica', descripcion: 'Impresión de alta calidad en papel texturizado 30×40 cm.', precio: 9900, categoria: 'cuadros', emoji: '🖼️', color_fondo: '#dde5e8', destacado: 0 },
    { nombre: 'Lámpara Tejida', descripcion: 'Pantalla de fibra natural con luz cálida 2700K.', precio: 34500, categoria: 'lamparas', emoji: '🏮', color_fondo: '#ede4d4', destacado: 0 },
    { nombre: 'Espejo Arco Natural', descripcion: 'Marco de madera de roble natural, forma arqueada, 40×90 cm.', precio: 54900, categoria: 'espejos', emoji: '🪞', color_fondo: '#f0e8d8', destacado: 0 },
    { nombre: 'Espejo Cuerpo Entero', descripcion: 'Marco negro mate, 45×150 cm. Perfecto para dormitorio.', precio: 79900, categoria: 'espejos', emoji: '🪞', color_fondo: '#dde5e8', destacado: 1 },
    { nombre: 'Set Velas Lavanda', descripcion: 'Set de 3 velas aromáticas de lavanda y bergamota.', precio: 19900, categoria: 'velas', emoji: '🕯️', color_fondo: '#ede5f0', destacado: 0 },
    { nombre: 'Cuadro Abstracto Arena', descripcion: 'Pintura abstracta en tonos arena y terracota, 50×60 cm.', precio: 44900, categoria: 'cuadros', emoji: '🖼️', color_fondo: '#f0ece0', destacado: 0 },
    { nombre: 'Toalla Baño Premium', descripcion: 'Toalla de algodón egipcio 600g, suave y absorbente.', precio: 22900, categoria: 'bano', emoji: '🚿', color_fondo: '#e0ecea', destacado: 0 },
    { nombre: 'Juego de Cama Lino', descripcion: 'Sábanas de lino natural, frescas y transpirables, queen size.', precio: 89900, categoria: 'ropa-de-cama', emoji: '🛏️', color_fondo: '#f0ece8', destacado: 1 },
  ];

  for (const p of productos) insertar.run(p);
  console.log('✅ Productos de ejemplo insertados');
}

module.exports = db;
