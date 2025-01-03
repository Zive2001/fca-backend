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

// Get POs for a selected plant and module
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
            .query(`
                SELECT DISTINCT Size 
                FROM PoData 
                WHERE Sewing_Order = @po 
                AND Size IS NOT NULL 
                AND Size != ''
                ORDER BY Size
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ 
                message: "No sizes found for this PO",
                data: []
            });
        }
        
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error("Error in getSizes:", error);
        res.status(500).json({ 
            error: error.message,
            data: []
        });
    }
};

const getStyles = async (req, res) => {
    const { po } = req.params;
    try {
        const pool = await connectDB();
        const result = await pool
            .request()
            .input("po", sql.NVarChar, po)
            .query(`
                SELECT DISTINCT 
                    Customer_Style,
                    BPL_Customer_Code
                FROM PoData 
                WHERE Sewing_Order = @po
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "No style found for this PO" });
        }
        
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error("Error in getStyles:", error);
        res.status(500).json({ error: error.message });
    }
};

const getCustomers = async (req, res) => {
    const { po } = req.params;
    try {
        const pool = await connectDB();
        const result = await pool
            .request()
            .input("po", sql.NVarChar, po)
            .query(`
                SELECT DISTINCT 
                    BPL_Customer_Code
                FROM PoData 
                WHERE Sewing_Order = @po
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "No customer found for this PO" });
        }

        res.status(200).json(result.recordset);
    } catch (error) {
        console.error("Error in getCustomers:", error);
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
            .query("SELECT Combined_Defect FROM DefectCodes WHERE Defect_Category = @category");
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getLocationCategory = async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query("SELECT DISTINCT Category FROM Defect_Locations");
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getDefectLocaition = async (req, res) => {
    const { category } = req.params;
    try {
        const pool = await connectDB();
        const result = await pool
            .request()
            .input("category", sql.NVarChar, category)
            .query("SELECT Defect_Location FROM Defect_Locations WHERE Category = @category");
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



// Submit FCA data
// In the second document where addFCAData is defined
const addFCAData = async (req, res) => {
    const {
        plant, module, shift, po, size, customer, style, inspectedQuantity, defectQuantity,
        defectDetails, status, defectRate, photoLinks, remarks, type
    } = req.body;

    const pool = await connectDB();
    const transaction = pool.transaction();

    try {
        await transaction.begin();

        // Insert into FCA_Audit table
        const result = await transaction.request()
            .input("plant", sql.NVarChar, plant)
            .input("module", sql.NVarChar, module)
            .input("shift", sql.NVarChar, shift)
            .input("po", sql.NVarChar, po)
            .input("size", sql.NVarChar, size)
            .input("customer", sql.NVarChar, customer)
            .input("style", sql.NVarChar, style)
            .input("inspectedQuantity", sql.Int, inspectedQuantity)
            .input("defectQuantity", sql.Int, defectQuantity)
            .input("status", sql.NVarChar, status)
            .input("defectRate", sql.Float, defectRate)
            .input("photoLinks", sql.NVarChar, photoLinks)
            .input("remarks", sql.NVarChar, remarks)
            .input("type", sql.NVarChar, type)
            .query(`
                INSERT INTO FCA_Audit (Plant, Module, Shift, PO, Size, Customer, Style, InspectedQuantity, DefectQuantity, Status, DefectRate, PhotoLinks, Remarks, Type)
                OUTPUT INSERTED.Id
                VALUES (@plant, @module, @shift, @po, @size, @customer, @style, @inspectedQuantity, @defectQuantity, @status, @defectRate, @photoLinks, @remarks, @type)
            `);

        const auditId = result.recordset[0].Id;

        // Batch insert defect details
        if (defectDetails && defectDetails.length > 0) {
            const defectValues = defectDetails.map(({ defectCategory, defectCode, quantity,locationCategory, defectLocation}) => 
                `(${auditId}, '${defectCategory}', '${defectCode}', ${quantity},'${locationCategory}', '${defectLocation}')`
            ).join(",");

            const defectsResult = await transaction.request().query(`
                INSERT INTO FCA_Defects (FCA_AuditId, DefectCategory, DefectCode, Quantity LocationCategoy,DefectLocation)
                OUTPUT INSERTED.Id, INSERTED.DefectCategory, INSERTED.DefectCode
                VALUES ${defectValues}
            `);

            await transaction.commit();
            res.status(201).json({ 
                message: "FCA data submitted successfully.",
                auditId: auditId,
                defects: defectsResult.recordset
            });
        } else {
            await transaction.commit();
            res.status(201).json({ 
                message: "FCA data submitted successfully.",
                auditId: auditId,
                defects: []
            });
        }
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ error: error.message });
    }
};


//get all FCA data

const getFCAData = async (req, res) => {
    const { plant, module, shift, po, size, status, date, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const pool = await connectDB();

        // Total count query for pagination
        const totalResult = await pool.request()
            .input("plant", sql.NVarChar, plant || null)
            .input("module", sql.NVarChar, module || null)
            .input("shift", sql.NVarChar, shift || null)
            .input("po", sql.NVarChar, po || null)
            .input("size", sql.NVarChar, size || null)
            .input("status", sql.NVarChar, status || null)
            .input("date", sql.Date, date || null)
            .query(`
                SELECT COUNT(*) AS Total
                FROM FCA_Audit A
                WHERE 
                    (@plant IS NULL OR A.Plant = @plant) AND
                    (@module IS NULL OR A.Module = @module) AND
                    (@shift IS NULL OR A.Shift = @shift) AND
                    (@po IS NULL OR A.PO = @po) AND
                    (@size IS NULL OR A.Size = @size) AND
                    (@status IS NULL OR A.Status = @status) AND
                    (@date IS NULL OR CONVERT(date, A.SubmissionDate) = @date)
            `);

        const total = totalResult.recordset[0].Total;

        // Fetch paginated data
        const dataResult = await pool.request()
            .input("plant", sql.NVarChar, plant || null)
            .input("module", sql.NVarChar, module || null)
            .input("shift", sql.NVarChar, shift || null)
            .input("po", sql.NVarChar, po || null)
            .input("size", sql.NVarChar, size || null)
            .input("status", sql.NVarChar, status || null)
            .input("date", sql.Date, date || null)
            .input("offset", sql.Int, offset)
            .input("limit", sql.Int, parseInt(limit))
            .query(`
                SELECT 
                    A.*, 
                    D.Id AS DefectId, D.DefectCategory, D.DefectCode
                FROM FCA_Audit A
                LEFT JOIN FCA_Defects D ON A.Id = D.FCA_AuditId
                WHERE 
                    (@plant IS NULL OR A.Plant = @plant) AND
                    (@module IS NULL OR A.Module = @module) AND
                    (@shift IS NULL OR A.Shift = @shift) AND
                    (@po IS NULL OR A.PO = @po) AND
                    (@size IS NULL OR A.Size = @size) AND
                    (@status IS NULL OR A.Status = @status) AND
                    (@date IS NULL OR CONVERT(date, A.SubmissionDate) = @date)
                ORDER BY A.Id OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
            `);

        const groupedResults = dataResult.recordset.reduce((acc, row) => {
            if (!acc[row.Id]) {
                acc[row.Id] = { ...row, defects: [] };
            }
            if (row.DefectCategory && row.DefectCode) {
                acc[row.Id].defects.push({
                    defectId: row.DefectId,
                    defectCategory: row.DefectCategory,
                    defectCode: row.DefectCode
                });
            }
            return acc;
        }, {});

        res.status(200).json({ total, data: Object.values(groupedResults) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};




// Update FCA data
const updateFCAData = async (req, res) => {
    const { id } = req.params; // Record ID to update
    const {
        plant, module, shift, po, size, inspectedQuantity, defectQuantity, defects, // Array of {defectCategory, defectCode, quantity}
        status, defectRate, photoLinks, remarks, type, style, customer
    } = req.body;

    const pool = await connectDB();
    const transaction = pool.transaction();

    try {
        await transaction.begin();

        // Update FCA_Audit table
        await transaction.request()
            .input("id", sql.Int, id)
            .input("plant", sql.NVarChar, plant)
            .input("module", sql.NVarChar, module)
            .input("shift", sql.NVarChar, shift)
            .input("po", sql.NVarChar, po)
            .input("size", sql.NVarChar, size)
            .input("style", sql.NVarChar, style)
            .input("customer", sql.NVarChar, customer)
            .input("inspectedQuantity", sql.Int, inspectedQuantity)
            .input("defectQuantity", sql.Int, defectQuantity)
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
                    Customer = @customer,
                    Style = @style, 
                    InspectedQuantity = @inspectedQuantity, 
                    DefectQuantity = @defectQuantity, 
                    Status = @status, 
                    DefectRate = @defectRate, 
                    PhotoLinks = @photoLinks, 
                    Remarks = @remarks, 
                    Type = @type
                WHERE Id = @id
            `);

        // Delete existing defects for the audit
        await transaction.request()
            .input("id", sql.Int, id)
            .query("DELETE FROM FCA_Defects WHERE FCA_AuditId = @id");

        // Re-insert updated defects
        if (defects && defects.length > 0) {
            const defectValues = defects.map(({ defectCategory, defectCode, quantity }) =>
                `(${id}, '${defectCategory}', '${defectCode}', ${quantity})`
            ).join(",");

            await transaction.request().query(`
                INSERT INTO FCA_Defects (FCA_AuditId, DefectCategory, DefectCode, Quantity)
                VALUES ${defectValues}
            `);
        }

        await transaction.commit();
        res.status(200).json({ message: "FCA data updated successfully." });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ error: error.message });
    }
};


// Delete FCA data
const deleteFCAData = async (req, res) => {
    const { id } = req.params;

    const pool = await connectDB();
    const transaction = pool.transaction();

    try {
        await transaction.begin();

        // Delete defects associated with the audit
        await transaction.request()
            .input("id", sql.Int, id)
            .query("DELETE FROM FCA_Defects WHERE FCA_AuditId = @id");

        // Delete the audit
        await transaction.request()
            .input("id", sql.Int, id)
            .query("DELETE FROM FCA_Audit WHERE Id = @id");

        await transaction.commit();
        res.status(200).json({ message: "FCA data deleted successfully." });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ error: error.message });
    }
};





module.exports = { getPlants, getPOs, getSizes, getDefectCategories, getDefectCodes, addFCAData,getModules,getFCAData, updateFCAData, deleteFCAData, getCustomers, getStyles, getDefectLocaition, getLocationCategory };
