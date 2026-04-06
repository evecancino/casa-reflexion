const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'casareflexion',
  user: 'postgres',
  password: 'Evelyn10',
  ssl: false
});

pool.query('SELECT 1', (err, res) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('✅ Conexión exitosa!');
  }
  pool.end();
});