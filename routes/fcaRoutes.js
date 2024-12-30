const express = require("express");
const { getPlants, getPOs, getSizes, getDefectCategories, getDefectCodes,getModules,getCustomers,getStyles, addFCAData, getFCAData, updateFCAData, deleteFCAData } = require("../controllers/fcaController");
const router = express.Router();


router.get("/plants", getPlants);
router.get("/modules/:plant", getModules);            
router.get("/pos/:module", getPOs);          
router.get("/sizes/:po", getSizes);         
router.get("/customers/:po", getCustomers);         
router.get("/styles/:po", getStyles);         
router.get("/defect-categories", getDefectCategories); 
router.get("/defect-codes/:category", getDefectCodes); 


router.post("/submit", addFCAData);


router.get("/data", getFCAData);       // View FCA data
router.put("/data/:id", updateFCAData); // Edit FCA data
router.delete("/data/:id", deleteFCAData); // Delete FCA data

module.exports = router;
