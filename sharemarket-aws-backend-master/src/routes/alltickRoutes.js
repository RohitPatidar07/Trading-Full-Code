const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const {
    getAllTickHealth,
    reconnectAllTick,
    getAllTickSymbols
} = require('../controllers/alltickController');

// Soft auth helper for read-only health checks (never fails if token is refreshing)
const softAuthMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.query?.token;
    if (token) {
        try {
            const jwt = require('jsonwebtoken');
            req.user = jwt.verify(token, process.env.JWT_SECRET);
        } catch (_) {}
    }
    next();
};

// AllTick health status — Available to authenticated users (and resilient to token refresh)
router.get('/health', softAuthMiddleware, getAllTickHealth);

// Monitored symbols
router.get('/symbols', softAuthMiddleware, getAllTickSymbols);

// Reconnect/Restart AllTick service — Protected for SUPERADMIN & ADMIN
router.post('/reconnect', authMiddleware, roleMiddleware(['SUPERADMIN', 'ADMIN']), reconnectAllTick);

module.exports = router;
