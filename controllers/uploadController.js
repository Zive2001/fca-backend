const multer = require("multer");
const xlsx = require("xlsx");
const { connectDB } = require("../db/dbConfig");

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Mapping function for column headers
const normalizeHeaders = {
    "Sewing work center": "Sewing_work_center",
    "Production Section": "Production_Section",
    "Season": "Season",
    "BPL Customer Code": "BPL_Customer_Code",
    "CPO Number": "CPO_Number",
    "Customer Style": "Customer_Style",
    "Sales order": "Sales_order",
    "Item": "Item",
    "Sewing Order": "Sewing_Order",
    "Customer Color": "Customer_Color",
    "Size": "Size",
    "Customer Color Descr": "Customer_Color_Descr"
};

// Upload Excel and insert into DB
const uploadExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Read file buffer directly
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        if (rawData.length < 2) {
            return res.status(400).json({ error: "File appears to be empty or invalid" });
        }

        // Normalize headers
        const headers = rawData[0].map(header => 
            normalizeHeaders[header?.trim()] || header?.trim()
        );

        // Validate required headers
        const requiredHeaders = ["Sewing_work_center", "Production_Section", "Sewing_Order"];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
            return res.status(400).json({
                error: "Missing required columns",
                missingColumns: missingHeaders
            });
        }

        const data = rawData.slice(1).map(row =>
            row.reduce((obj, value, index) => {
                obj[headers[index]] = value;
                return obj;
            }, {})
        );

        const pool = await connectDB();
        let insertedCount = 0;

        for (let row of data) {
            try {
                const query = `
                    INSERT INTO PoData (
                        Sewing_work_center, Production_Section, Season, 
                        BPL_Customer_Code, CPO_Number, Customer_Style,
                        Sales_order, Item, Sewing_Order, Customer_Color,
                        Size, Customer_Color_Descr
                    )
                    VALUES (
                        @Sewing_work_center, @Production_Section, @Season,
                        @BPL_Customer_Code, @CPO_Number, @Customer_Style,
                        @Sales_order, @Item, @Sewing_Order, @Customer_Color,
                        @Size, @Customer_Color_Descr
                    )
                `;

                await pool.request()
                    .input("Sewing_work_center", row.Sewing_work_center || null)
                    .input("Production_Section", row.Production_Section || null)
                    .input("Season", row.Season || null)
                    .input("BPL_Customer_Code", row.BPL_Customer_Code || null)
                    .input("CPO_Number", row.CPO_Number || null)
                    .input("Customer_Style", row.Customer_Style || null)
                    .input("Sales_order", row.Sales_order || null)
                    .input("Item", row.Item || null)
                    .input("Sewing_Order", row.Sewing_Order || null)
                    .input("Customer_Color", row.Customer_Color || null)
                    .input("Size", row.Size || null)
                    .input("Customer_Color_Descr", row.Customer_Color_Descr || null)
                    .query(query);

                insertedCount++;
            } catch (error) {
                console.error(`Error inserting row:`, error);
                // Continue with next row
            }
        }

        res.status(200).json({
            message: "File processed successfully",
            totalRows: data.length,
            insertedRows: insertedCount
        });
    } catch (error) {
        console.error("Error processing file:", error);
        res.status(500).json({
            error: "Error processing file",
            details: error.message
        });
    }
};

module.exports = { upload, uploadExcel };