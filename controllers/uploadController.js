const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");
const { connectDB } = require("../db/dbConfig"); // Ensure correct path to dbconfig

// Configure Multer for file uploads
const upload = multer({ dest: "uploads/" });

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
    const filePath = req.file.path; // Get the uploaded file's path

    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Read the first sheet
        const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        // Normalize headers
        const headers = rawData[0].map(header => normalizeHeaders[header.trim()] || header.trim());
        const data = rawData.slice(1).map(row =>
            row.reduce((obj, value, index) => {
                obj[headers[index]] = value;
                return obj;
            }, {})
        );

        const pool = await connectDB(); // Connect to database

        for (let row of data) {
            const query = `
                INSERT INTO PoData (Sewing_work_center, Production_Section, Season, BPL_Customer_Code, CPO_Number, Customer_Style, Sales_order, Item, Sewing_Order, Customer_Color, Size, Customer_Color_Descr)
    VALUES (@Sewing_work_center, @Production_Section, @Season, @BPL_Customer_Code, @CPO_Number, @Customer_Style, @Sales_order, @Item, @Sewing_Order, @Customer_Color, @Size, @Customer_Color_Descr)
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
        }

        // Delete the file after successful processing
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error("Error deleting file:", err);
            }
        });

        res.status(200).send("File uploaded and data inserted successfully!");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error processing file");
    } finally {
        // Ensure file is deleted in case of errors
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error("Error deleting file in finally block:", err);
            }
        });
    }
};

module.exports = { upload, uploadExcel };
