const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : new Pool({
      host: 'localhost',
      port: 5432,
      database: 'casareflexion',
      user: 'postgres',
      password: 'Evelyn10',
      ssl: false
    });

async function inicializarDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        precio INTEGER NOT NULL,
        categoria TEXT NOT NULL,
        emoji TEXT,
        foto TEXT,
        color_fondo TEXT DEFAULT '#f0e8d8',
        destacado INTEGER DEFAULT 0,
        stock INTEGER DEFAULT 10,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        rol TEXT DEFAULT 'cliente',
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS carrito (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
        producto_id INTEGER NOT NULL REFERENCES productos(id),
        cantidad INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
        total INTEGER NOT NULL,
        estado TEXT DEFAULT 'pendiente',
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const { rows } = await client.query('SELECT COUNT(*) as total FROM productos');
    if (parseInt(rows[0].total) === 0) {
      const productos = [
        ['Jarrón Siena', 'Cerámica artesanal en tono terracota con acabado mate.', 24990, 'ceramica', '🏺', '#e8ddd4', 0],
        ['Maceta Nórdica', 'Maceta de concreto con diseño minimalista escandinavo.', 18500, 'maseteros', '🪴', '#dce5dc', 0],
        ['Vela Sándalo & Cedro', '80 horas de aroma envolvente con cera de soya natural.', 12990, 'velas', '🕯️', '#f0e8d8', 1],
        ['Espejo Luna Dorado', 'Marco de metal dorado satinado, Ø 50 cm, ideal para sala.', 39900, 'espejos', '🪞', '#e5e0ec', 0],
        ['Lámina Botánica', 'Impresión de alta calidad en papel texturizado 30×40 cm.', 9900, 'cuadros', '🖼️', '#dde5e8', 0],
        ['Lámpara Tejida', 'Pantalla de fibra natural con luz cálida 2700K.', 34500, 'lamparas', '🏮', '#ede4d4', 0],
        ['Espejo Arco Natural', 'Marco de madera de roble natural, forma arqueada, 40×90 cm.', 54900, 'espejos', '🪞', '#f0e8d8', 0],
        ['Espejo Cuerpo Entero', 'Marco negro mate, 45×150 cm. Perfecto para dormitorio.', 79900, 'espejos', '🪞', '#dde5e8', 1],
        ['Set Velas Lavanda', 'Set de 3 velas aromáticas de lavanda y bergamota.', 19900, 'velas', '🕯️', '#ede5f0', 0],
        ['Cuadro Abstracto Arena', 'Pintura abstracta en tonos arena y terracota, 50×60 cm.', 44900, 'cuadros', '🖼️', '#f0ece0', 0],
        ['Toalla Baño Premium', 'Toalla de algodón egipcio 600g, suave y absorbente.', 22900, 'bano', '🚿', '#e0ecea', 0],
        ['Juego de Cama Lino', 'Sábanas de lino natural, frescas y transpirables, queen size.', 89900, 'ropa-de-cama', '🛏️', '#f0ece8', 1],
      ];

      for (const p of productos) {
        await client.query(
          'INSERT INTO productos (nombre, descripcion, precio, categoria, emoji, color_fondo, destacado) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          p
        );
      }
      console.log('✅ Productos de ejemplo insertados en PostgreSQL');
    }
  } catch(err) {
    console.error('Error inicializando DB:', err.message);
  } finally {
    client.release();
  }
}

inicializarDB();

module.exports = pool;