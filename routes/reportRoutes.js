const express = require('express');
const router = express.Router();
const { generateFailureReport } = require('../controllers/reportController');

// Generate failure report
router.get('/failure-report/:auditId', generateFailureReport);

module.exports = router;