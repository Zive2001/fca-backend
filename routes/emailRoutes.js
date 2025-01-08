const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const emailController = require('../controllers/emailController');

router.post('/send-notification', upload.array('photos'), emailController.sendEmailNotification);
router.get('/recipients/:plantId', emailController.getEmailRecipients);

module.exports = router;