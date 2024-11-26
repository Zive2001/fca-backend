const express = require("express");
const { getPlants, getPOs, getSizes, getDefectCategories, getDefectCodes, addFCAData } = require("../controllers/fcaController");
const router = express.Router();

//Get methods
router.get("/plants", getPlants);           
router.get("/pos/:plant", getPOs);          
router.get("/sizes/:po", getSizes);         
router.get("/defect-categories", getDefectCategories); 
router.get("/defect-codes/:category", getDefectCodes); 
router.post("/submit", addFCAData);        

module.exports = router;
