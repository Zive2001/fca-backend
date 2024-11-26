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
    const { plant,module, shift, po, size, inspectedQuantity, defectQuantity, defectCategory, defectCode, status, defectRate, photoLinks } = req.body;

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
            .input("defectCategory", sql.NVarChar, defectCategory)
            .input("defectCode", sql.NVarChar, defectCode)
            .input("status", sql.NVarChar, status)
            .input("defectRate", sql.Float, defectRate)
            .input("photoLinks", sql.NVarChar, photoLinks)
            .query(`
                INSERT INTO FCA_Audit (Plant, Module, Shift, PO, Size, InspectedQuantity, DefectQuantity, DefectCategory, DefectCode, Status, DefectRate, PhotoLinks)
                VALUES (@plant, @module, @shift, @po, @size, @inspectedQuantity, @defectQuantity, @defectCategory, @defectCode, @status, @defectRate, @photoLinks)
            `);
        res.status(201).json({ message: "FCA data submitted successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getPlants, getPOs, getSizes, getDefectCategories, getDefectCodes, addFCAData,getModules };
