const sql = require('mssql');
const { connectDB } = require('../db/dbConfig');

const getDashboardAnalytics = async (req, res) => {
    const { startDate, endDate, plant } = req.query;
    
    try {
        const pool = await connectDB();
        
        // Prepare date filtering based on explicit start and end dates
        const dateFilter = startDate && endDate 
            ? "SubmissionDate BETWEEN @startDate AND @endDate" 
            : "SubmissionDate >= DATEADD(day, -7, GETDATE())"; // Default to 7 days if no date range
        
        // Get audit counts by status
        const auditCountsQuery = `
            SELECT 
                Type,
                Status,
                COUNT(*) as count
            FROM FCA_Audit
            WHERE 
                ${plant !== 'all' ? 'Plant = @plant AND' : ''} 
                ${dateFilter}
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
                ${dateFilter}
            GROUP BY d.DefectCategory
            ORDER BY count DESC
        `;
        
        // Get defect trends with formatted dates
        const defectTrendsQuery = `
            SELECT 
                CAST(SubmissionDate AS DATE) as date,
                ROUND(AVG(DefectRate), 2) as defectRate
            FROM FCA_Audit
            WHERE 
                ${plant !== 'all' ? 'Plant = @plant AND' : ''} 
                ${dateFilter}
            GROUP BY CAST(SubmissionDate AS DATE)
            ORDER BY date
        `;
        
        // Get plant metrics
        const plantMetricsQuery = `
            SELECT 
                Plant,
                ROUND(AVG(DefectRate), 2) as avgDefectRate,
                ROUND((COUNT(CASE WHEN Status = 'Pass' THEN 1 END) * 100.0 / COUNT(*)), 2) as passRate,
                COUNT(*) as totalAudits,
                COUNT(CASE WHEN Status = 'Pass' THEN 1 END) as passedAudits,
                COUNT(CASE WHEN Status = 'Fail' THEN 1 END) as failedAudits
            FROM FCA_Audit
            WHERE ${dateFilter}
            ${plant !== 'all' ? 'AND Plant = @plant' : ''} 
            GROUP BY Plant
        `;

        // Get customer performance analysis
        const customerAnalysisQuery = `
            SELECT 
                Customer,
                COUNT(*) as totalAudits,
                COUNT(CASE WHEN Status = 'Pass' THEN 1 END) as passedAudits,
                COUNT(CASE WHEN Status = 'Fail' THEN 1 END) as failedAudits,
                ROUND(COUNT(CASE WHEN Status = 'Pass' THEN 1 END) * 100.0 / COUNT(*), 2) as passRate,
                ROUND(AVG(DefectRate), 2) as avgDefectRate
            FROM FCA_Audit
            WHERE ${dateFilter}
            ${plant !== 'all' ? 'AND Plant = @plant' : ''} 
            GROUP BY Customer
            ORDER BY totalAudits DESC
        `;

        // Get defect count by defect code
        const defectCodeAnalysisQuery = `
            SELECT 
                d.DefectCode,
                SUM(d.Quantity) as defectCount
            FROM FCA_Defects d
            JOIN FCA_Audit a ON d.FCA_AuditId = a.Id
            WHERE ${dateFilter}
            ${plant !== 'all' ? 'AND a.Plant = @plant' : ''} 
            GROUP BY d.DefectCode
            ORDER BY defectCount DESC
        `;

        const request = pool.request();
        
        if (startDate && endDate) {
            request.input('startDate', sql.Date, new Date(startDate));
            request.input('endDate', sql.Date, new Date(endDate));
        }
        
        if (plant !== 'all') {
            request.input('plant', sql.NVarChar, plant);
        }

        const [
            auditCounts, 
            defectCategories, 
            defectTrends, 
            plantMetrics,
            customerAnalysis,
            defectCodeAnalysis
        ] = await Promise.all([
            request.query(auditCountsQuery),
            request.query(defectCategoriesQuery),
            request.query(defectTrendsQuery),
            request.query(plantMetricsQuery),
            request.query(customerAnalysisQuery),
            request.query(defectCodeAnalysisQuery)
        ]);

        // Calculate overall metrics for KPI cards
        const totalAudits = plantMetrics.recordset.reduce((sum, plant) => sum + plant.totalAudits, 0);
        const passedAudits = plantMetrics.recordset.reduce((sum, plant) => sum + plant.passedAudits, 0);
        const failedAudits = plantMetrics.recordset.reduce((sum, plant) => sum + plant.failedAudits, 0);
        const overallPassRate = totalAudits > 0 ? (passedAudits / totalAudits * 100).toFixed(2) : 0;
        const overallDefectRate = plantMetrics.recordset.length > 0 
            ? (plantMetrics.recordset.reduce((sum, plant) => sum + (plant.avgDefectRate * plant.totalAudits), 0) / totalAudits).toFixed(2)
            : 0;

        res.status(200).json({
            auditCounts: auditCounts.recordset,
            defectCategories: defectCategories.recordset,
            defectTrends: defectTrends.recordset,
            plantMetrics: plantMetrics.recordset,
            customerAnalysis: customerAnalysis.recordset,
            defectCodeAnalysis: defectCodeAnalysis.recordset,
            overallMetrics: {
                totalAudits,
                passedAudits,
                failedAudits,
                overallPassRate,
                overallDefectRate
            }
        });
    } catch (error) {
        console.error('Error getting dashboard analytics:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getDashboardAnalytics };