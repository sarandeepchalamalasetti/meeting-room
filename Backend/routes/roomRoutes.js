const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const verifyToken = require('../middleware/verifyToken');

// Existing routes
router.get('/', roomController.getAllRooms);
router.post('/seed', roomController.seedRooms); // Call once to insert data

// ✅ ENHANCED: Dashboard routes with filter support
router.get('/statistics', verifyToken, roomController.getRoomStatistics);
router.get('/heatmap', verifyToken, roomController.getBookingHeatmap);
router.get('/filters', roomController.getFilters);

// ✅ ENHANCED: Room utilization endpoint with filter support for RoomUtilization component
router.get('/utilization', verifyToken, roomController.getRoomUtilization);

module.exports = router;