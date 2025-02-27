const express = require('express');
const router = express.Router();
const { getDashboardAnalytics } = require('../controllers/dashboardController');
const sql = require('mssql');
const { connectDB } = require('../db/dbConfig');

// Main dashboard analytics endpoint - updated to support date range
router.get('/dashboard', getDashboardAnalytics);

// Get module-wise performance - updated with date range
router.get('/module-analysis', async (req, res) =>  {
    const { startDate, endDate, plant } = req.query;
    try {
        const pool = await connectDB();
        const request = pool.request();
        
        // Prepare date filtering
        let dateFilter;
        if (startDate && endDate) {
            dateFilter = "SubmissionDate BETWEEN @startDate AND @endDate";
            request.input('startDate', sql.Date, new Date(startDate));
            request.input('endDate', sql.Date, new Date(endDate));
        } else {
            dateFilter = "SubmissionDate >= DATEADD(day, -7, GETDATE())";
        }
        
        if (plant !== 'all') {
            request.input('plant', sql.NVarChar, plant);
        }

        const query = `
            SELECT 
                Module,
                COUNT(*) as totalAudits,
                ROUND(AVG(DefectRate), 2) as avgDefectRate,
                ROUND(SUM(CASE WHEN Status = 'Pass' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as passRate,
                SUM(InspectedQuantity) as totalInspected,
                SUM(DefectQuantity) as totalDefects
            FROM FCA_Audit
            WHERE ${dateFilter}
            ${plant !== 'all' ? 'AND Plant = @plant' : ''}
            GROUP BY Module
            ORDER BY avgDefectRate DESC
        `;
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get customer-wise analysis - updated with date range
router.get('/customer-analysis', async (req, res) => {
    const { startDate, endDate, plant } = req.query;
    try {
        const pool = await connectDB();
        const request = pool.request();
        
        // Prepare date filtering
        let dateFilter;
        if (startDate && endDate) {
            dateFilter = "SubmissionDate BETWEEN @startDate AND @endDate";
            request.input('startDate', sql.Date, new Date(startDate));
            request.input('endDate', sql.Date, new Date(endDate));
        } else {
            dateFilter = "SubmissionDate >= DATEADD(day, -7, GETDATE())";
        }
        
        if (plant !== 'all') {
            request.input('plant', sql.NVarChar, plant);
        }

        const query = `
            SELECT 
                Customer,
                Style,
                COUNT(*) as totalAudits,
                COUNT(CASE WHEN Status = 'Pass' THEN 1 END) as passedAudits,
                COUNT(CASE WHEN Status = 'Fail' THEN 1 END) as failedAudits,
                ROUND(AVG(DefectRate), 2) as avgDefectRate,
                ROUND(SUM(CASE WHEN Status = 'Pass' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as passRate
            FROM FCA_Audit
            WHERE ${dateFilter}
            ${plant !== 'all' ? 'AND Plant = @plant' : ''}
            GROUP BY Customer, Style
            ORDER BY totalAudits DESC
        `;
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get defect location analysis - updated with date range
router.get('/defect-location-analysis', async (req, res) => {
    const { startDate, endDate, plant } = req.query;
    try {
        const pool = await connectDB();
        const request = pool.request();
        
        // Prepare date filtering
        let dateFilter;
        if (startDate && endDate) {
            dateFilter = "a.SubmissionDate BETWEEN @startDate AND @endDate";
            request.input('startDate', sql.Date, new Date(startDate));
            request.input('endDate', sql.Date, new Date(endDate));
        } else {
            dateFilter = "a.SubmissionDate >= DATEADD(day, -7, GETDATE())";
        }
        
        if (plant !== 'all') {
            request.input('plant', sql.NVarChar, plant);
        }

        const query = `
            SELECT 
                d.LocationCategory,
                d.DefectLocation,
                COUNT(*) as frequency,
                SUM(d.Quantity) as totalDefects,
                ROUND(AVG(a.DefectRate), 2) as avgDefectRate
            FROM FCA_Defects d
            JOIN FCA_Audit a ON d.FCA_AuditId = a.Id
            WHERE ${dateFilter}
            ${plant !== 'all' ? 'AND a.Plant = @plant' : ''}
            GROUP BY d.LocationCategory, d.DefectLocation
            ORDER BY totalDefects DESC
        `;
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// New endpoint for defect code analysis
router.get('/defect-code-analysis', async (req, res) => {
    const { startDate, endDate, plant } = req.query;
    try {
        const pool = await connectDB();
        const request = pool.request();
        
        // Prepare date filtering
        let dateFilter;
        if (startDate && endDate) {
            dateFilter = "a.SubmissionDate BETWEEN @startDate AND @endDate";
            request.input('startDate', sql.Date, new Date(startDate));
            request.input('endDate', sql.Date, new Date(endDate));
        } else {
            dateFilter = "a.SubmissionDate >= DATEADD(day, -7, GETDATE())";
        }
        
        if (plant !== 'all') {
            request.input('plant', sql.NVarChar, plant);
        }

        const query = `
            SELECT 
                d.DefectCode,
                d.DefectCategory,
                SUM(d.Quantity) as defectCount
            FROM FCA_Defects d
            JOIN FCA_Audit a ON d.FCA_AuditId = a.Id
            WHERE ${dateFilter}
            ${plant !== 'all' ? 'AND a.Plant = @plant' : ''}
            GROUP BY d.DefectCode, d.DefectCategory
            ORDER BY defectCount DESC
        `;
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;