const express = require("express");
const { getPlants, getPOs, getSizes, getDefectCategories, getDefectCodes, addFCAData } = require("../controllers/fcaController");
const router = express.Router();

router.get("/plants", getPlants);           // Get list of plants
router.get("/pos/:plant", getPOs);          // Get POs for a plant
router.get("/sizes/:po", getSizes);         // Get sizes for a PO
router.get("/defect-categories", getDefectCategories); // Get defect categories
router.get("/defect-codes/:category", getDefectCodes); // Get defect codes for a category
router.post("/submit", addFCAData);         // Submit FCA data

module.exports = router;
