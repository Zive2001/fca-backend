const express = require("express");
const { 
    getPlants, 
    getPOs, 
    getSizes, 
    getDefectCategories, 
    getDefectCodes,
    getModules,
    getCustomers,
    getStyles, 
    addFCAData, 
    getFCAData, 
    updateFCAData, 
    deleteFCAData, 
    getDefectLocaition,
    getLocationCategory, 
    getCustomerColor, 
    getCustomerColorDesc,
    getCPONumber,         
  
} = require("../controllers/fcaController");

const router = express.Router();

// Existing routes
router.get("/plants", getPlants);
router.get("/modules/:plant", getModules);            
router.get("/pos/:module", getPOs);          
router.get("/sizes/:po", getSizes);         
router.get("/customers/:po", getCustomers);         
router.get("/styles/:po", getStyles);   
router.get("/color/:po", getCustomerColor);         
router.get("/colordesc/:po", getCustomerColorDesc);       
router.get("/defect-categories", getDefectCategories); 
router.get("/defect-codes/:category", getDefectCodes); 
router.get("/location-categories", getLocationCategory);
router.get("/defect-locations/:category", getDefectLocaition);


// Add new route for CPO number
router.get("/cpo/:po", getCPONumber);

// Data manipulation routes
router.post("/submit", addFCAData);
router.get("/data", getFCAData);
router.put("/data/:id", updateFCAData);
router.delete("/data/:id", deleteFCAData);

module.exports = router;