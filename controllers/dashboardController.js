const sql = require('mssql');
const { connectDB } = require('../db/dbConfig');

const getDashboardAnalytics = async (req, res) => {
    const { dateRange, plant } = req.query;
    
    try {
        const pool = await connectDB();
        const dateRangeInt = parseInt(dateRange);
        
        // Get audit counts by type
        const auditCountsQuery = `
            SELECT 
                Type,
                Status,
                COUNT(*) as count
            FROM FCA_Audit
            WHERE 
                ${plant !== 'all' ? 'Plant = @plant AND' : ''} 
                SubmissionDate >= DATEADD(day, -@dateRange, GETDATE())
            GROUP BY Type, Status
        `;
        
        // Get top defect categories
        const defectCategoriesQuery = `
            SELECT 
                d.DefectCategory,
                COUNT(*) as count
            FROM FCA_Defects d
            JOIN FCA_Audit a ON d.FCA_AuditId = a.Id
            WHERE 
                ${plant !== 'all' ? 'a.Plant = @plant AND' : ''} 
                a.SubmissionDate >= DATEADD(day, -@dateRange, GETDATE())
            GROUP BY d.DefectCategory
            ORDER BY count DESC
        `;
        
        // Get defect trends
        const defectTrendsQuery = `
            SELECT 
                CAST(SubmissionDate AS DATE) as date,
                AVG(DefectRate) as defectRate
            FROM FCA_Audit
            WHERE 
                ${plant !== 'all' ? 'Plant = @plant AND' : ''} 
                SubmissionDate >= DATEADD(day, -@dateRange, GETDATE())
            GROUP BY CAST(SubmissionDate AS DATE)
            ORDER BY date
        `;
        
        // Get plant metrics
        const plantMetricsQuery = `
            SELECT 
                Plant,
                AVG(DefectRate) as avgDefectRate,
                (COUNT(CASE WHEN Status = 'pass' THEN 1 END) * 100.0 / COUNT(*)) as passRate
            FROM FCA_Audit
            WHERE SubmissionDate >= DATEADD(day, -@dateRange, GETDATE())
            ${plant !== 'all' ? 'AND Plant = @plant' : ''} 
            GROUP BY Plant
        `;

        const request = pool.request()
            .input('dateRange', sql.Int, dateRangeInt)
            .input('plant', sql.NVarChar, plant);

        const [auditCounts, defectCategories, defectTrends, plantMetrics] = await Promise.all([
            request.query(auditCountsQuery),
            request.query(defectCategoriesQuery),
            request.query(defectTrendsQuery),
            request.query(plantMetricsQuery)
        ]);

        res.status(200).json({
            auditCounts: auditCounts.recordset,
            defectCategories: defectCategories.recordset,
            defectTrends: defectTrends.recordset,
            plantMetrics: plantMetrics.recordset
        });
    } catch (error) {
        console.error('Error getting dashboard analytics:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getDashboardAnalytics };