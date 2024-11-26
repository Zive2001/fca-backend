const express = require("express");
const { getPlants, getPOs, getSizes, getDefectCategories, getDefectCodes,getModules, addFCAData } = require("../controllers/fcaController");
const router = express.Router();


router.get("/plants", getPlants);
router.get("/modules/:plant", getModules);            
router.get("/pos/:module", getPOs);          
router.get("/sizes/:po", getSizes);         
router.get("/defect-categories", getDefectCategories); 
router.get("/defect-codes/:category", getDefectCodes); 
router.post("/submit", addFCAData);        

module.exports = router;
