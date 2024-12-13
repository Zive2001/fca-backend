const express = require("express");
const { upload, uploadExcel } = require("../controllers/uploadController");
const router = express.Router();

// Route for uploading Excel file
router.post("/upload", upload.single("file"), uploadExcel);

module.exports = router;
