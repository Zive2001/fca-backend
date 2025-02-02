// reportRoutes.js
const express = require('express');
const router = express.Router();
const { generateFailureReport } = require('../controllers/reportController');

// Wrap the route handler in try-catch for better error handling
router.get('/failure-report/:auditId', async (req, res, next) => {
    try {
        await generateFailureReport(req, res);
    } catch (error) {
        console.error('Route error:', error);
        next(error);
    }
});

module.exports = router;