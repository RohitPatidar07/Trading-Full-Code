const express = require('express');
const router = express.Router();
const { placeOrder, getTrades, getTradeById, getGroupTrades, getActivePositions, closeTrade, deleteTrade, updateTrade, restoreTrade, modifyPendingOrder, setTargetSL, completePendingOrder, squareOffAllTrades } = require('../controllers/tradeController');
const { authMiddleware, roleMiddleware, brokerPermission } = require('../middleware/auth');
const validateOrderRequest = require('../middleware/validateOrderRequest');

router.get('/health', (req, res) => res.json({ status: 'OK', message: 'Trade routes active' }));
router.get('/group', authMiddleware, getGroupTrades);
router.get('/active', authMiddleware, getActivePositions);
router.get('/closed', authMiddleware, getTrades);

router.get('/', authMiddleware, getTrades);
router.get('/:id', authMiddleware, getTradeById);

<<<<<<< HEAD
router.post('/', authMiddleware, brokerPermission('tradeActivityAllowed'), placeOrder);
router.post('/place', authMiddleware, brokerPermission('tradeActivityAllowed'), placeOrder);
router.post('/user/:userId/square-off-all', authMiddleware, roleMiddleware(['SUPERADMIN', 'ADMIN', 'BROKER']), squareOffAllTrades);
=======
router.post('/', authMiddleware, brokerPermission('tradeActivityAllowed'), validateOrderRequest, placeOrder);
router.post('/place', authMiddleware, brokerPermission('tradeActivityAllowed'), validateOrderRequest, placeOrder);
>>>>>>> f567a0d87c77b0e9f9bd8d20c5e5793c24d93b6c

router.put('/:id/close', authMiddleware, roleMiddleware(['SUPERADMIN', 'ADMIN', 'BROKER', 'TRADER']), closeTrade);
router.put('/:id/target-sl', authMiddleware, setTargetSL);
router.put('/:id/modify', authMiddleware, modifyPendingOrder);
router.put('/:id/complete', authMiddleware, roleMiddleware(['SUPERADMIN', 'ADMIN', 'BROKER']), completePendingOrder);
router.put('/:id', authMiddleware, roleMiddleware(['SUPERADMIN', 'ADMIN']), updateTrade);
router.put('/:id/restore', authMiddleware, roleMiddleware(['SUPERADMIN', 'ADMIN']), restoreTrade);
router.delete('/:id', authMiddleware, roleMiddleware(['SUPERADMIN', 'ADMIN']), deleteTrade);

module.exports = router;
