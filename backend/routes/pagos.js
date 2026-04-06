const express = require('express');
const router = express.Router();
const { WebpayPlus, Options, IntegrationApiKeys, IntegrationCommerceCodes, Environment } = require('transbank-sdk');
const jwt = require('jsonwebtoken');
const db = require('../database-pg');

const SECRET = process.env.JWT_SECRET || 'casareflexion_secret_2026';

const tx = new WebpayPlus.Transaction(new Options(
  IntegrationCommerceCodes.WEBPAY_PLUS,
  IntegrationApiKeys.WEBPAY,
  Environment.Integration
));

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

// POST /api/pagos/iniciar
router.post('/iniciar', verificarToken, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT c.cantidad, p.precio
      FROM carrito c
      JOIN productos p ON c.producto_id = p.id
      WHERE c.usuario_id = $1
    `, [req.usuario.id]);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    const total = rows.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    const ordenId = `ORD-${req.usuario.id}-${Date.now()}`;
    const returnUrl = process.env.NODE_ENV === 'production'
      ? 'https://casa-reflexion.onrender.com/Pages/pago-resultado.html'
      : 'http://localhost:3000/Pages/pago-resultado.html';

    const response = await tx.create(ordenId, `sesion-${req.usuario.id}`, total, returnUrl);

    await db.query("INSERT INTO pedidos (usuario_id, total, estado) VALUES ($1, $2, 'pendiente')", [req.usuario.id, total]);

    res.json({ url: response.url, token: response.token });
  } catch (err) {
    console.error('Error Transbank:', err);
    res.status(500).json({ error: 'Error al iniciar el pago' });
  }
});

// POST /api/pagos/confirmar
router.post('/confirmar', verificarToken, async (req, res) => {
  const { token_ws } = req.body;
  if (!token_ws) return res.status(400).json({ error: 'Token de pago requerido' });

  try {
    const response = await tx.commit(token_ws);

    if (response.status === 'AUTHORIZED') {
      await db.query("UPDATE pedidos SET estado = 'pagado' WHERE usuario_id = $1 AND estado = 'pendiente'", [req.usuario.id]);
      await db.query('DELETE FROM carrito WHERE usuario_id = $1', [req.usuario.id]);

      res.json({
        exito: true,
        mensaje: '¡Pago exitoso!',
        orden: response.buy_order,
        monto: response.amount,
        fecha: response.transaction_date
      });
    } else {
      res.json({ exito: false, mensaje: 'El pago fue rechazado' });
    }
  } catch (err) {
    console.error('Error confirmando pago:', err);
    res.status(500).json({ error: 'Error al confirmar el pago' });
  }
});

module.exports = router;