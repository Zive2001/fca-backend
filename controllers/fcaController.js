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
    const { plant } = req.params;
    try {
        const pool = await connectDB();
        const result = await pool
            .request()
            .input("plant", sql.NVarChar, plant)
            .query("SELECT DISTINCT Sewing_Order FROM PoData WHERE Production_Section = @plant");
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

const getCustomerColor = async (req, res) => {
    const { po } = req.params;
    try {
        const pool = await connectDB();
        const result = await pool
            .request()
            .input("po", sql.NVarChar, po)
            .query(`
                SELECT DISTINCT 
                    Customer_Color
                FROM PoData 
                WHERE Sewing_Order = @po
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "No colour found for this PO" });
        }

        res.status(200).json(result.recordset);
    } catch (error) {
        console.error("Error in getCustomerColor:", error);
        res.status(500).json({ error: error.message });
    }
};

const getCustomerColorDesc = async (req, res) => {
    const { po } = req.params;
    try {
        const pool = await connectDB();
        const result = await pool
            .request()
            .input("po", sql.NVarChar, po)
            .query(`
                SELECT DISTINCT 
                    Customer_Color_Descr
                FROM PoData 
                WHERE Sewing_Order = @po
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "No colour description found for this PO" });
        }

        res.status(200).json(result.recordset);
    } catch (error) {
        console.error("Error in getCustomerColorDesc:", error);
        res.status(500).json({ error: error.message });
    }
};
const getCPONumber = async (req, res) => {
    const { po } = req.params;
    try {
        const pool = await connectDB();
        const result = await pool
            .request()
            .input("po", sql.NVarChar, po)
            .query(`
                SELECT DISTINCT 
                    CPO_Number
                FROM PoData 
                WHERE Sewing_Order = @po
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "No CPO number found for this PO" });
        }

        res.status(200).json(result.recordset);
    } catch (error) {
        console.error("Error in getCPONumber:", error);
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

const addFCAData = async (req, res) => {
    const {
        plant, module, shift, po, size, customer, style, inspectedQuantity, defectQuantity,
        defectDetails, status, defectRate, remarks, type, color, colorDesc, cpoNumber, createdBy
    } = req.body;

    const pool = await connectDB();
    const transaction = pool.transaction();

    try {
        await transaction.begin();
        
        // Insert into Users table with proper error handling
        const userResult = await transaction.request()
            .input('email', sql.NVarChar, createdBy)
            .query(`
                MERGE INTO Users AS target
                USING (VALUES (@email)) AS source (Email)
                ON target.Email = source.Email
                WHEN NOT MATCHED THEN
                    INSERT (Email, CreatedAt)
                    VALUES (@email, GETDATE());
            `);

        // Insert into FCA_Audit table with CreatedBy
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
            .input("color", sql.NVarChar, color)
            .input("colorDesc", sql.NVarChar, colorDesc)
            .input("remarks", sql.NVarChar, remarks)
            .input("type", sql.NVarChar, type)
            .input("cpoNumber", sql.NVarChar, cpoNumber)
            .input("createdBy", sql.NVarChar, createdBy)
            .query(`
                INSERT INTO FCA_Audit (
                    Plant, Module, Shift, PO, Size, Customer, Style, 
                    InspectedQuantity, DefectQuantity, Status, DefectRate, 
                    Remarks, Type, Customer_Color, Customer_Color_Descr, CPO_Number, CreatedBy, CreatedAt
                )
                OUTPUT INSERTED.Id
                VALUES (
                    @plant, @module, @shift, @po, @size, @customer, @style,
                    @inspectedQuantity, @defectQuantity, @status, @defectRate,
                    @remarks, @type, @color, @colorDesc, @cpoNumber, @createdBy, GETDATE()
                )
            `);

        const auditId = result.recordset[0].Id;

        // Modified defect details handling to include location information
        if (defectDetails && defectDetails.length > 0) {
            const defectValues = defectDetails.map(({ defectCategory, defectCode, quantity, locationCategory, defectLocation }) => {
                // Ensure all values are properly escaped and handle null/undefined values
                const escapedDefectLocation = defectLocation ? defectLocation.replace(/'/g, "''") : '';
                const escapedLocationCategory = locationCategory ? locationCategory.replace(/'/g, "''") : '';
                
                return `(${auditId}, 
                        '${defectCategory}', 
                        '${defectCode}', 
                        ${quantity}, 
                        '${escapedLocationCategory}', 
                        '${escapedDefectLocation}')`;
            }).join(",");
            
            const defectsResult = await transaction.request().query(`
                INSERT INTO FCA_Defects (
                    FCA_AuditId, 
                    DefectCategory, 
                    DefectCode, 
                    Quantity, 
                    LocationCategory, 
                    DefectLocation
                )
                OUTPUT 
                    INSERTED.Id, 
                    INSERTED.DefectCategory, 
                    INSERTED.DefectCode,
                    INSERTED.LocationCategory,
                    INSERTED.DefectLocation
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
        console.error("Error in addFCAData:", error);
        res.status(500).json({ error: error.message });
    }
};

//get all FCA data
const getFCAData = async (req, res) => {
    const { plant, module, shift, po, size, status, type, date, page = 1, limit = 10 } = req.query;
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
            .input("type", sql.NVarChar, type || null)
            .input("date", sql.Date, date || null)
            .query(`
                SELECT COUNT(DISTINCT A.Id) AS Total
                FROM FCA_Audit A
                WHERE 
                    (@plant IS NULL OR A.Plant = @plant) AND
                    (@module IS NULL OR A.Module = @module) AND
                    (@shift IS NULL OR A.Shift = @shift) AND
                    (@po IS NULL OR A.PO LIKE '%' + @po + '%') AND
                    (@size IS NULL OR A.Size = @size) AND
                    (@status IS NULL OR A.Status = @status) AND
                    (@type IS NULL OR A.Type = @type) AND
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
            .input("type", sql.NVarChar, type || null)
            .input("date", sql.Date, date || null)
            .input("offset", sql.Int, offset)
            .input("limit", sql.Int, parseInt(limit))
            .query(`
                WITH OrderedAudits AS (
                    SELECT A.*,
                           ROW_NUMBER() OVER (ORDER BY A.Id DESC) as RowNum
                    FROM FCA_Audit A
                    WHERE 
                        (@plant IS NULL OR A.Plant = @plant) AND
                        (@module IS NULL OR A.Module = @module) AND
                        (@shift IS NULL OR A.Shift = @shift) AND
                        (@po IS NULL OR A.PO LIKE '%' + @po + '%') AND
                        (@size IS NULL OR A.Size = @size) AND
                        (@status IS NULL OR A.Status = @status) AND
                        (@type IS NULL OR A.Type = @type) AND
                        (@date IS NULL OR CONVERT(date, A.SubmissionDate) = @date)
                )
                SELECT 
                    A.*,
                    D.Id AS DefectId,
                    D.DefectCategory,
                    D.DefectCode
                FROM OrderedAudits A
                LEFT JOIN FCA_Defects D ON A.Id = D.FCA_AuditId
                WHERE A.RowNum > @offset AND A.RowNum <= (@offset + @limit)
                ORDER BY A.Id DESC;
            `);

        const groupedResults = dataResult.recordset.reduce((acc, row) => {
            if (!acc[row.Id]) {
                const {
                    DefectId, DefectCategory, DefectCode, RowNum,
                    ...auditData
                } = row;
                acc[row.Id] = { ...auditData, defects: [] };
            }
            if (row.DefectId) {
                acc[row.Id].defects.push({
                    defectId: row.DefectId,
                    defectCategory: row.DefectCategory,
                    defectCode: row.DefectCode
                });
            }
            return acc;
        }, {});

        // Convert to array and ensure DESC order by Id
        const sortedData = Object.values(groupedResults).sort((a, b) => b.Id - a.Id);

        res.status(200).json({ 
            total, 
            data: sortedData
        });
    } catch (error) {
        console.error("Error in getFCAData:", error);
        res.status(500).json({ error: error.message });
    }
};


// Update FCA data
const updateFCAData = async (req, res) => {
    const { id } = req.params; // Record ID to update
    const {
        plant, module, shift, po, size, inspectedQuantity, defectQuantity, defects, // Array of {defectCategory, defectCode, quantity}
        status, defectRate, remarks, type, style, customer
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
    const transaction = await pool.transaction();

    try {
        await transaction.begin();

        // First check if the record exists
        const checkResult = await transaction.request()
            .input("id", sql.Int, id)
            .query("SELECT Id FROM FCA_Audit WHERE Id = @id");

        if (checkResult.recordset.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ error: "Record not found" });
        }

        // First, get all defect IDs associated with this audit
        const defectResult = await transaction.request()
            .input("id", sql.Int, id)
            .query("SELECT Id FROM FCA_Defects WHERE FCA_AuditId = @id");

        // If there are defects, delete their photos first
        if (defectResult.recordset.length > 0) {
            const defectIds = defectResult.recordset.map(d => d.Id);
            
            // Delete photos for all defects
            await transaction.request()
                .input("auditId", sql.Int, id)
                .query(`
                    DELETE FROM FCA_DefPhoto 
                    WHERE FCA_DefectId IN (
                        SELECT Id FROM FCA_Defects WHERE FCA_AuditId = @auditId
                    )
                `);
        }

        // Now delete the defects
        await transaction.request()
            .input("id", sql.Int, id)
            .query("DELETE FROM FCA_Defects WHERE FCA_AuditId = @id");

        // Finally delete the audit
        await transaction.request()
            .input("id", sql.Int, id)
            .query("DELETE FROM FCA_Audit WHERE Id = @id");

        await transaction.commit();
        res.status(200).json({ message: "FCA data deleted successfully." });
    } catch (error) {
        console.error("Error in deleteFCAData:", error);
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error("Error rolling back transaction:", rollbackError);
            }
        }
        res.status(500).json({ 
            error: "Failed to delete FCA data", 
            details: error.message 
        });
    }
};
// const generateFailureReport = async (req, res) => {
//     const { auditId } = req.params;
    
//     try {
//         const pool = await connectDB();
        
//         // Get main audit data
//         const auditResult = await pool.request()
//             .input('auditId', sql.Int, auditId)
//             .query(`
//                 SELECT 
//                     A.*,
//                     CONVERT(varchar, A.SubmissionDate, 120) as FormattedSubmissionDate
//                 FROM FCA_Audit A
//                 WHERE A.Id = @auditId
//             `);

//         if (auditResult.recordset.length === 0) {
//             return res.status(404).json({ message: "Audit record not found" });
//         }

//         const auditData = auditResult.recordset[0];

//         // Get defects with their photos
//         const defectsResult = await pool.request()
//             .input('auditId', sql.Int, auditId)
//             .query(`
//                 SELECT 
//                     D.Id AS DefectId,
//                     D.DefectCategory,
//                     D.DefectCode,
//                     D.Quantity,
//                     D.LocationCategory,
//                     D.DefectLocation,
//                     P.Id AS PhotoId,
//                     P.PhotoData,
//                     P.PhotoMimeType,
//                     P.PhotoName
//                 FROM FCA_Defects D
//                 LEFT JOIN FCA_DefPhoto P ON D.Id = P.FCA_DefectId
//                 WHERE D.FCA_AuditId = @auditId
//                 ORDER BY D.Id, P.Id
//             `);

//         // Process defects and their photos
//         const defectMap = new Map();
//         defectsResult.recordset.forEach(record => {
//             if (!defectMap.has(record.DefectId)) {
//                 defectMap.set(record.DefectId, {
//                     defectId: record.DefectId,
//                     defectCategory: record.DefectCategory,
//                     defectCode: record.DefectCode,
//                     quantity: record.Quantity,
//                     locationCategory: record.LocationCategory,
//                     defectLocation: record.DefectLocation,
//                     photos: []
//                 });
//             }
            
//             if (record.PhotoId) {
//                 const photoData = record.PhotoData;
//                 if (photoData) {
//                     const base64Photo = Buffer.from(photoData).toString('base64');
//                     defectMap.get(record.DefectId).photos.push({
//                         id: record.PhotoId,
//                         name: record.PhotoName,
//                         data: `data:${record.PhotoMimeType};base64,${base64Photo}`
//                     });
//                 }
//             }
//         });

//         const reportData = {
//             ...auditData,
//             defectEntries: Array.from(defectMap.values())
//         };

//         res.status(200).json(reportData);
//     } catch (error) {
//         console.error("Error generating failure report:", error);
//         res.status(500).json({ error: error.message });
//     }
// };




module.exports = { getPlants, getPOs, getSizes, getDefectCategories, getDefectCodes, addFCAData,getModules,getFCAData, updateFCAData, deleteFCAData, getCustomers, getStyles, getDefectLocaition, getLocationCategory,getCustomerColor,getCustomerColorDesc,getCustomerColorDesc,getCPONumber };
