// photoController.js
const { connectDB, sql } = require("../db/dbConfig");
const multer = require('multer');
const upload = multer().single('photo'); // Configure multer for single file uploads

// Function to add a photo
const addDefectPhoto = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Multer upload error:', err);
            return res.status(400).json({ error: 'File upload error', details: err.message });
        }

        try {
            const auditId = parseInt(req.body.auditId);
            const defectId = parseInt(req.body.defectId);
            const file = req.file;

            // Enhanced validation
            if (!file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            if (!auditId || !defectId || isNaN(auditId) || isNaN(defectId)) {
                return res.status(400).json({ 
                    error: 'Invalid parameters',
                    details: `auditId: ${auditId}, defectId: ${defectId}`
                });
            }

            // Add logging
            console.log('Processing photo upload:', {
                auditId,
                defectId,
                fileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype
            });

            const pool = await connectDB();
            
            // Verify the defect exists before adding photo
            const defectCheck = await pool.request()
                .input('defectId', sql.Int, defectId)
                .query('SELECT Id FROM FCA_Defects WHERE Id = @defectId');

            if (defectCheck.recordset.length === 0) {
                return res.status(404).json({ 
                    error: 'Defect not found',
                    details: `DefectId ${defectId} does not exist`
                });
            }

            const result = await pool.request()
                .input('auditId', sql.Int, auditId)
                .input('defectId', sql.Int, defectId)
                .input('photoName', sql.NVarChar, file.originalname)
                .input('photoData', sql.VarBinary(sql.MAX), file.buffer)
                .input('photoMimeType', sql.NVarChar, file.mimetype)
                .query(`
                    INSERT INTO FCA_DefPhoto (
                        FCA_AuditId, 
                        FCA_DefectId, 
                        PhotoName, 
                        PhotoData, 
                        PhotoMimeType,
                        UploadDate
                    )
                    OUTPUT INSERTED.Id
                    VALUES (
                        @auditId, 
                        @defectId, 
                        @photoName, 
                        @photoData, 
                        @mimeType,
                        GETDATE()
                    )
                `);

            const photoId = result.recordset[0].Id;
            
            console.log('Photo uploaded successfully:', {
                photoId,
                auditId,
                defectId
            });

            res.status(201).json({ 
                id: photoId,
                message: "Photo uploaded successfully",
                fileName: file.originalname
            });
        } catch (error) {
            console.error('Database error in addDefectPhoto:', error);
            res.status(500).json({ 
                error: 'Database error',
                details: error.message 
            });
        }
    });
};

// Function to get a photo
const getDefectPhoto = async (req, res) => {
    const { photoId } = req.params;
    
    try {
        const pool = await connectDB();
        const result = await pool.request()
            .input('photoId', sql.Int, photoId)
            .query(`
                SELECT PhotoData, PhotoMimeType, PhotoName 
                FROM FCA_DefPhoto 
                WHERE Id = @photoId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Photo not found" });
        }

        const photo = result.recordset[0];
        res.writeHead(200, {
            'Content-Type': photo.PhotoMimeType,
            'Content-Disposition': `attachment; filename="${photo.PhotoName}"`,
        });
        res.end(photo.PhotoData);
    } catch (error) {
        console.error('Error in getDefectPhoto:', error);
        res.status(500).json({ error: error.message });
    }
};

// Function to get all photos for a defect
const getDefectPhotos = async (req, res) => {
    const { defectId } = req.params;
    
    try {
        const pool = await connectDB();
        const result = await pool.request()
            .input('defectId', sql.Int, defectId)
            .query(`
                SELECT Id, PhotoName, PhotoMimeType, UploadDate 
                FROM FCA_DefPhoto 
                WHERE FCA_DefectId = @defectId
                ORDER BY UploadDate DESC
            `);
        
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error in getDefectPhotos:', error);
        res.status(500).json({ error: error.message });
    }
};

// Function to delete a photo
const deleteDefectPhoto = async (req, res) => {
    const { photoId } = req.params;
    
    try {
        const pool = await connectDB();
        await pool.request()
            .input('photoId', sql.Int, photoId)
            .query('DELETE FROM FCA_DefPhoto WHERE Id = @photoId');
        
        res.status(200).json({ message: "Photo deleted successfully" });
    } catch (error) {
        console.error('Error in deleteDefectPhoto:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update your module.exports to include the new functions
module.exports = {
    // ... existing exports ...
    addDefectPhoto,
    getDefectPhoto,
    getDefectPhotos,
    deleteDefectPhoto
};