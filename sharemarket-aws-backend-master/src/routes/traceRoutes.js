const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { getTradeTrace } = require('../controllers/traceController');

// Trace a specific trade — Accessible by SUPERADMIN, ADMIN, and BROKER
router.get('/trade/:tradeId', authMiddleware, roleMiddleware(['SUPERADMIN', 'ADMIN', 'BROKER']), getTradeTrace);

module.exports = router;
