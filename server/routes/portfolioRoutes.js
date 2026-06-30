const express = require('express');
const PortfolioLink = require('../models/PortfolioLink');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const router = express.Router();
router.use(authMiddleware, requireRole('candidate'));
module.exports = router;
