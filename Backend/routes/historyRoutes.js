const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const {
  getUserHistory,
  addToHistory,
  deleteHistoryEntry,
  getHistoryStats
} = require('../controllers/historyController');

// Get history statistics - must come before /:id route
router.get('/stats', verifyToken, getHistoryStats);

// Get user's booking history
router.get('/', verifyToken, getUserHistory);

// Add booking to history manually
router.post('/add', verifyToken, addToHistory);

// Delete history entry - specific ID route
router.delete('/:id', verifyToken, deleteHistoryEntry);

module.exports = router;