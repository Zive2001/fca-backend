// Failure report controller
const generateFailureReport = async (req, res) => {
    const { auditId } = req.params;
    
    try {
        const pool = await connectDB();
        
        // Get main audit data
        const auditResult = await pool.request()
            .input('auditId', sql.Int, auditId)
            .query(`
                SELECT 
                    A.*,
                    CONVERT(varchar, A.SubmissionDate, 120) as FormattedSubmissionDate
                FROM FCA_Audit A
                WHERE A.Id = @auditId
            `);

        if (auditResult.recordset.length === 0) {
            return res.status(404).json({ message: "Audit record not found" });
        }

        const auditData = auditResult.recordset[0];

        // Get defects with their photos
        const defectsResult = await pool.request()
            .input('auditId', sql.Int, auditId)
            .query(`
                SELECT 
                    D.*,
                    P.Id AS PhotoId,
                    P.PhotoData,
                    P.PhotoMimeType,
                    P.PhotoName,
                    P.UploadDate
                FROM FCA_Defects D
                LEFT JOIN FCA_DefPhoto P ON D.Id = P.FCA_DefectId
                WHERE D.FCA_AuditId = @auditId
                ORDER BY D.Id, P.UploadDate
            `);

        // Process defects and their photos
        const defectMap = new Map();
        defectsResult.recordset.forEach(record => {
            if (!defectMap.has(record.Id)) {
                defectMap.set(record.Id, {
                    id: record.Id,
                    defectCategory: record.DefectCategory,
                    defectCode: record.DefectCode,
                    quantity: record.Quantity,
                    locationCategory: record.LocationCategory,
                    defectLocation: record.DefectLocation,
                    photos: []
                });
            }
            
            if (record.PhotoId) {
                const photoBuffer = record.PhotoData;
                if (photoBuffer) {
                    const base64Photo = photoBuffer.toString('base64');
                    defectMap.get(record.Id).photos.push({
                        id: record.PhotoId,
                        name: record.PhotoName,
                        dataUrl: `data:${record.PhotoMimeType};base64,${base64Photo}`,
                        uploadDate: record.UploadDate
                    });
                }
            }
        });

        const reportData = {
            ...auditData,
            defectEntries: Array.from(defectMap.values())
        };

        // Calculate summary statistics
        const totalDefects = reportData.defectEntries.reduce((sum, entry) => sum + entry.quantity, 0);
        const categorySummary = reportData.defectEntries.reduce((acc, entry) => {
            acc[entry.defectCategory] = (acc[entry.defectCategory] || 0) + entry.quantity;
            return acc;
        }, {});

        reportData.summary = {
            totalDefects,
            categorySummary,
            inspectionDate: reportData.FormattedSubmissionDate,
            totalPhotos: reportData.defectEntries.reduce((sum, entry) => sum + entry.photos.length, 0)
        };

        res.status(200).json(reportData);
    } catch (error) {
        console.error("Error generating failure report:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { generateFailureReport };