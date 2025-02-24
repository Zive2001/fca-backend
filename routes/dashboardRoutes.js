const express = require('express');
const router = express.Router();
const { getDashboardAnalytics } = require('../controllers/dashboardController');
const sql = require('mssql');
const { connectDB } = require('../db/dbConfig');

// Main dashboard analytics endpoint
router.get('/dashboard', getDashboardAnalytics);

// Get shift-wise performance
router.get('/shift-analysis', async (req, res) =>  {
    const { dateRange, plant } = req.query;
    try {
        const pool = await connectDB();
        const result = await pool.request()
            .input('dateRange', sql.Int, parseInt(dateRange))
            .input('plant', sql.NVarChar, plant)
            .query(`
                SELECT 
                    Shift,
                    COUNT(*) as totalAudits,
                    AVG(DefectRate) as avgDefectRate,
                    SUM(CASE WHEN Status = 'Pass' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as passRate,
                    AVG(InspectedQuantity) as avgInspectedQty,
                    AVG(DefectQuantity) as avgDefectQty
                FROM FCA_Audit
                WHERE SubmissionDate >= DATEADD(day, -@dateRange, GETDATE())
                ${plant !== 'all' ? 'AND Plant = @plant' : ''}
                GROUP BY Shift
            `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get module-wise performance
router.get('/module-analysis', async (req, res) =>  {
    const { dateRange, plant } = req.query;
    try {
        const pool = await connectDB();
        const result = await pool.request()
            .input('dateRange', sql.Int, parseInt(dateRange))
            .input('plant', sql.NVarChar, plant)
            .query(`
                SELECT 
                    Module,
                    COUNT(*) as totalAudits,
                    AVG(DefectRate) as avgDefectRate,
                    SUM(CASE WHEN Status = 'Pass' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as passRate,
                    SUM(InspectedQuantity) as totalInspected,
                    SUM(DefectQuantity) as totalDefects
                FROM FCA_Audit
                WHERE SubmissionDate >= DATEADD(day, -@dateRange, GETDATE())
                ${plant !== 'all' ? 'AND Plant = @plant' : ''}
                GROUP BY Module
                ORDER BY avgDefectRate DESC
            `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get customer-wise analysis
router.get('/customer-analysis', async (req, res) =>{
    const { dateRange, plant } = req.query;
    try {
        const pool = await connectDB();
        const result = await pool.request()
            .input('dateRange', sql.Int, parseInt(dateRange))
            .input('plant', sql.NVarChar, plant)
            .query(`
                SELECT 
                    Customer,
                    Style,
                    COUNT(*) as totalAudits,
                    AVG(DefectRate) as avgDefectRate,
                    SUM(CASE WHEN Status = 'Pass' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as passRate
                FROM FCA_Audit
                WHERE SubmissionDate >= DATEADD(day, -@dateRange, GETDATE())
                ${plant !== 'all' ? 'AND Plant = @plant' : ''}
                GROUP BY Customer, Style
                ORDER BY avgDefectRate DESC
            `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get defect location analysis
router.get('/defect-location-analysis', async (req, res) => {
    const { dateRange, plant } = req.query;
    try {
        const pool = await connectDB();
        const result = await pool.request()
            .input('dateRange', sql.Int, parseInt(dateRange))
            .input('plant', sql.NVarChar, plant)
            .query(`
                SELECT 
                    d.LocationCategory,
                    d.DefectLocation,
                    COUNT(*) as frequency,
                    AVG(a.DefectRate) as avgDefectRate
                FROM FCA_Defects d
                JOIN FCA_Audit a ON d.FCA_AuditId = a.Id
                WHERE a.SubmissionDate >= DATEADD(day, -@dateRange, GETDATE())
                ${plant !== 'all' ? 'AND a.Plant = @plant' : ''}
                GROUP BY d.LocationCategory, d.DefectLocation
                ORDER BY frequency DESC
            `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;