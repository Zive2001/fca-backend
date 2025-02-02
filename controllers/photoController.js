// photoController.js
const { connectDB, sql } = require("../db/dbConfig");
const multer = require('multer');

// Configure multer with memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
}).single('photo');

// Function to add a photo
const addDefectPhoto = async (req, res) => {
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err);
            return res.status(400).json({ 
                error: 'File upload error',
                details: err.message 
            });
        } else if (err) {
            console.error('Unknown error:', err);
            return res.status(500).json({ 
                error: 'Unknown error occurred during upload',
                details: err.message 
            });
        }

        // Validate request
        if (!req.file) {
            return res.status(400).json({ error: 'No photo file provided' });
        }

        const auditId = parseInt(req.body.auditId);
        const defectId = parseInt(req.body.defectId);

        if (isNaN(auditId) || isNaN(defectId)) {
            return res.status(400).json({ error: 'Invalid auditId or defectId' });
        }

        try {
            const pool = await connectDB();
            
            // Convert file buffer to proper format for SQL Server
            const photoBuffer = Buffer.from(req.file.buffer);
            
            const result = await pool.request()
                .input('auditId', sql.Int, auditId)
                .input('defectId', sql.Int, defectId)
                .input('photoName', sql.NVarChar, req.file.originalname)
                .input('photoData', sql.VarBinary(sql.MAX), photoBuffer)
                .input('mimeType', sql.NVarChar, req.file.mimetype)
                .query(`
                    INSERT INTO FCA_DefPhoto (
                        FCA_AuditId, 
                        FCA_DefectId, 
                        PhotoName, 
                        PhotoData, 
                        PhotoMimeType
                    )
                    OUTPUT INSERTED.Id
                    VALUES (
                        @auditId, 
                        @defectId, 
                        @photoName, 
                        @photoData, 
                        @mimeType
                    )
                `);

            const photoId = result.recordset[0].Id;
            
            res.status(201).json({ 
                id: photoId,
                message: "Photo uploaded successfully",
                fileName: req.file.originalname
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
        const photoBuffer = Buffer.from(photo.PhotoData);

        res.writeHead(200, {
            'Content-Type': photo.PhotoMimeType,
            'Content-Disposition': `attachment; filename="${photo.PhotoName}"`,
            'Content-Length': photoBuffer.length
        });
        res.end(photoBuffer);
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
                SELECT 
                    Id, 
                    PhotoName, 
                    PhotoMimeType, 
                    UploadDate,
                    DATALENGTH(PhotoData) as PhotoSize
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
        const result = await pool.request()
            .input('photoId', sql.Int, photoId)
            .query('DELETE FROM FCA_DefPhoto WHERE Id = @photoId');
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Photo not found" });
        }
        
        res.status(200).json({ message: "Photo deleted successfully" });
    } catch (error) {
        console.error('Error in deleteDefectPhoto:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    addDefectPhoto,
    getDefectPhoto,
    getDefectPhotos,
    deleteDefectPhoto
};