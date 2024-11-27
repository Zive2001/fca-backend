const { connectDB, sql } = require("../db/dbConfig");

// Get list of plants
const getPlants = async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query("SELECT DISTINCT Production_Section FROM PoData");
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//add this to the insert query after adding a coulmn

const getModules = async (req, res) => {
    const { plant } = req.params;
    try {
        const pool = await connectDB();
        const result = await pool
            .request()
            .input("plant", sql.NVarChar, plant)
            .query("SELECT DISTINCT Sewing_work_center FROM PoData WHERE Production_Section = @plant");
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get POs for a selected plant
const getPOs = async (req, res) => {
    const { module } = req.params;
    try {
        const pool = await connectDB();
        const result = await pool
            .request()
            .input("module", sql.NVarChar, module)
            .query("SELECT DISTINCT Sewing_Order FROM PoData WHERE Sewing_work_center = @module");
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Get sizes for a selected PO
const getSizes = async (req, res) => {
    const { po } = req.params;
    try {
        const pool = await connectDB();
        const result = await pool
            .request()
            .input("po", sql.NVarChar, po)
            .query("SELECT DISTINCT Size FROM PoData WHERE Sewing_Order = @po");
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get defect categories
const getDefectCategories = async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query("SELECT DISTINCT Defect_Category FROM DefectCodes");
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get defect codes for a category
const getDefectCodes = async (req, res) => {
    const { category } = req.params;
    try {
        const pool = await connectDB();
        const result = await pool
            .request()
            .input("category", sql.NVarChar, category)
            .query("SELECT Defect_Code FROM DefectCodes WHERE Defect_Category = @category");
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Submit FCA data
const addFCAData = async (req, res) => {
    const { plant,module, shift, po, size, inspectedQuantity, defectQuantity, defectCategory, defectCode, status, defectRate, photoLinks,remarks, type } = req.body;

    try {
        const pool = await connectDB();
        await pool.request()
            .input("plant", sql.NVarChar, plant)
            .input("module", sql.NVarChar, module)
            .input("shift", sql.NVarChar, shift)
            .input("po", sql.NVarChar, po)
            .input("size", sql.NVarChar, size)
            .input("inspectedQuantity", sql.Int, inspectedQuantity)
            .input("defectQuantity", sql.Int, defectQuantity)
            .input("remarks", sql.NVarChar, remarks)
            .input("defectCategory", sql.NVarChar, defectCategory)
            .input("defectCode", sql.NVarChar, defectCode)
            .input("status", sql.NVarChar, status)
            .input("defectRate", sql.Float, defectRate)
            .input("photoLinks", sql.NVarChar, photoLinks)
            .input("type", sql.NVarChar, type)
            .query(`
                INSERT INTO FCA_Audit (Plant, Module, Shift, PO, Size, InspectedQuantity, DefectQuantity, DefectCategory, DefectCode, Status, DefectRate, PhotoLinks, Remarks, Type)
                VALUES (@plant, @module, @shift, @po, @size, @inspectedQuantity, @defectQuantity, @defectCategory, @defectCode, @status, @defectRate, @photoLinks, @remarks, @type)
            `);
        res.status(201).json({ message: "FCA data submitted successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Fetch all FCA data with optional filters
const getFCAData = async (req, res) => {
    const { plant, module, shift, po, size, page = 1, limit = 10 } = req.query; // Pagination parameters
    const offset = (page - 1) * limit;

    try {
        const pool = await connectDB();
        const query = `
            SELECT * 
            FROM FCA_Audit 
            WHERE 
                (@plant IS NULL OR Plant = @plant) AND
                (@module IS NULL OR Module = @module) AND
                (@shift IS NULL OR Shift = @shift) AND
                (@po IS NULL OR PO = @po) AND
                (@size IS NULL OR Size = @size)
            ORDER BY Id OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
        `;
        const result = await pool.request()
            .input("plant", sql.NVarChar, plant || null)
            .input("module", sql.NVarChar, module || null)
            .input("shift", sql.NVarChar, shift || null)
            .input("po", sql.NVarChar, po || null)
            .input("size", sql.NVarChar, size || null)
            .input("offset", sql.Int, offset)
            .input("limit", sql.Int, parseInt(limit))
            .query(query);

        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Update FCA data
const updateFCAData = async (req, res) => {
    const { id } = req.params; // Record ID to update
    const { plant, module, shift, po, size, inspectedQuantity, defectQuantity, defectCategory, defectCode, status, defectRate, photoLinks, remarks, type } = req.body;

    try {
        const pool = await connectDB();
        await pool.request()
            .input("id", sql.Int, id)
            .input("plant", sql.NVarChar, plant)
            .input("module", sql.NVarChar, module)
            .input("shift", sql.NVarChar, shift)
            .input("po", sql.NVarChar, po)
            .input("size", sql.NVarChar, size)
            .input("inspectedQuantity", sql.Int, inspectedQuantity)
            .input("defectQuantity", sql.Int, defectQuantity)
            .input("defectCategory", sql.NVarChar, defectCategory)
            .input("defectCode", sql.NVarChar, defectCode)
            .input("status", sql.NVarChar, status)
            .input("defectRate", sql.Float, defectRate)
            .input("photoLinks", sql.NVarChar, photoLinks)
            .input("remarks", sql.NVarChar, remarks)
            .input("type", sql.NVarChar, type)
            .query(`
                UPDATE FCA_Audit 
                SET 
                    Plant = @plant, 
                    Module = @module, 
                    Shift = @shift, 
                    PO = @po, 
                    Size = @size, 
                    InspectedQuantity = @inspectedQuantity, 
                    DefectQuantity = @defectQuantity, 
                    DefectCategory = @defectCategory, 
                    DefectCode = @defectCode, 
                    Status = @status, 
                    DefectRate = @defectRate, 
                    PhotoLinks = @photoLinks, 
                    Remarks = @remarks, 
                    Type = @type
                WHERE Id = @id
            `);

        res.status(200).json({ message: "FCA data updated successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete FCA data
const deleteFCAData = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await connectDB();
        await pool.request()
            .input("id", sql.Int, id)
            .query("DELETE FROM FCA_Audit WHERE Id = @id");

        res.status(200).json({ message: "FCA data deleted successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};











module.exports = { getPlants, getPOs, getSizes, getDefectCategories, getDefectCodes, addFCAData,getModules,getFCAData, updateFCAData, deleteFCAData };
