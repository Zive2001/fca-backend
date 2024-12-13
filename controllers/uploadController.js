const multer = require("multer");
const xlsx = require("xlsx");
const poolPromise = require("../db"); // Assuming you already have a DB connection setup like in your existing project

// Configure Multer for file uploads
const upload = multer({ dest: "uploads/" });

// Upload Excel and insert into DB
const uploadExcel = async (req, res) => {
    try {
        const filePath = req.file.path; // Get the uploaded file's path
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Read the first sheet
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const pool = await poolPromise;

        for (let row of data) {
            const query = `
                INSERT INTO YourTableName (Sewing_work_center, Production_Section, Season, BPL_Customer_Code, CPO_Number, Customer_Style, Sales_order, Item, Sewing_Order, Customer_Color, Size)
                VALUES (@Sewing_work_center, @Production_Section, @Season, @BPL_Customer_Code, @CPO_Number, @Customer_Style, @Sales_order, @Item, @Sewing_Order, @Customer_Color, @Size)
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
                .query(query);
        }

        res.status(200).send("File uploaded and data inserted successfully!");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error processing file");
    }
};

module.exports = { upload, uploadExcel };
