// photoRoutes.js
const express = require('express');
const router = express.Router();
const photoController = require('../controllers/photoController'); // Adjust path as necessary

router.post('/add', photoController.addDefectPhoto);
router.get('/:photoId', photoController.getDefectPhoto);
router.get('/defect/:defectId', photoController.getDefectPhotos);
router.delete('/:photoId', photoController.deleteDefectPhoto);

module.exports = router;
