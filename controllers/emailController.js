const soap = require('soap');
const { connectDB, sql } = require("../db/dbConfig");
const multer = require('multer');
const upload = multer().array('photos');

const EMAIL_SERVICE_URL = 'https://sg-prod-bdyapp-email.azurewebsites.net/Service.svc?wsdl';

// Create SOAP client once
let soapClient = null;
const initializeSoapClient = async () => {
    if (!soapClient) {
        try {
            soapClient = await soap.createClientAsync(EMAIL_SERVICE_URL);
        } catch (error) {
            console.error("Error initializing SOAP client:", error);
            throw error;
        }
    }
    return soapClient;
};

// Get email recipients for a plant
const getEmailRecipients = async (req, res) => {
    const { plantId } = req.params;

    try {
        const pool = await connectDB();
        const result = await pool.request()
            .input('plantId', sql.NVarChar, plantId)
            .query(`
                SELECT DISTINCT
                    EmailType,
                    EmailAddress 
                FROM PlantEmailRecipients 
                WHERE PlantId = @plantId 
                AND IsActive = 1
                AND EmailAddress IS NOT NULL
                AND EmailAddress != ''
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                message: "No email recipients found for this plant",
                data: []
            });
        }

        res.status(200).json(result.recordset);
    } catch (error) {
        console.error("Error in getEmailRecipients:", error);
        res.status(500).json({
            error: error.message,
            data: []
        });
    }
};

// Send email notification
const sendEmailNotification = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: 'File upload error' });
        }

        try {
            const emailData = JSON.parse(req.body.emailData);
            const { toList, subject, body } = emailData;
            const attachments = req.files || [];

            const emailAttachments = attachments.map(file => ({
                filename: file.originalname,
                content: file.buffer.toString('base64'),
                contentType: file.mimetype
            }));

            const client = await initializeSoapClient();

            const emailParams = {
                to: Array.isArray(toList) ? toList.join(';') : toList,
                subject,
                body,
                attachments: emailAttachments
            };

            const result = await client.SendMailHTMLAsync(emailParams);

            res.status(200).json({
                message: 'Email sent successfully',
                result
            });
        } catch (error) {
            console.error("Error in sendEmailNotification:", error);
            res.status(500).json({ error: error.message });
        }
    });
};

module.exports = {
    getEmailRecipients,
    sendEmailNotification
};
