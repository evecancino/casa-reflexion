const db = require('./database');
db.prepare("UPDATE usuarios SET rol = 'admin' WHERE id = 1").run();
console.log('✅ Usuario 1 convertido en admin');

