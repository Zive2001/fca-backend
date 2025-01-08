// emailController.js
const soap = require('soap');
const { connectDB, sql } = require("../db/dbConfig");
const multer = require('multer');
const upload = multer().array('photos');

const EMAIL_SERVICE_URL = 'https://sg-prod-bdyapp-email.azurewebsites.net/Service.svc?wsdl';

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

        res.status(200).json(result.recordset || []);
    } catch (error) {
        console.error("Error in getEmailRecipients:", error);
        res.status(500).json({ error: error.message });
    }
};

const generateEmailBody = (formData, defectEntries) => {
    return `
        <html>
            <body>
                <h2>FCA Failure Notification</h2>
                <h3>Form Details:</h3>
                <table style="border-collapse: collapse; width: 100%;">
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;"><strong>Plant:</strong></td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${formData.plant}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;"><strong>Module:</strong></td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${formData.module}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;"><strong>PO:</strong></td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${formData.po}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;"><strong>Style:</strong></td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${formData.style}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;"><strong>Defect Rate:</strong></td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${formData.defectRate}%</td>
                    </tr>
                </table>

                <h3>Defect Details:</h3>
                <table style="border-collapse: collapse; width: 100%;">
                    <thead>
                        <tr>
                            <th style="border: 1px solid #ddd; padding: 8px;">Category</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Code</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Location</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${defectEntries.map(defect => `
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 8px;">${defect.defectCategory}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${defect.defectCode}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${defect.defectLocation}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${defect.quantity}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <p><strong>Remarks:</strong> ${formData.remarks || 'N/A'}</p>
            </body>
        </html>
    `;
};

const sendEmailNotification = async (req, res) => {
    let parsedEmailData;
    try {
        // Parse the email data from the request
        parsedEmailData = JSON.parse(req.body.emailData);
        const { plant, formData, auditId, defectEntries } = parsedEmailData;

        // Fetch email recipients
        const pool = await connectDB();
        const recipientsResult = await pool.request()
            .input('plantId', sql.NVarChar, plant)
            .query(`
                SELECT EmailAddress 
                FROM PlantEmailRecipients 
                WHERE PlantId = @plantId 
                AND IsActive = 1
            `);

        // Send email to each recipient individually
        const client = await initializeSoapClient();
        const subject = `FCA Failure Notification - ${plant} - PO: ${formData.po}`;
        const body = generateEmailBody(formData, defectEntries);

        // Send to each recipient individually to avoid semicolon issues
        const emailPromises = recipientsResult.recordset.map(async (recipient) => {
            try {
                await client.SendMailHTMLAsync({
                    to: recipient.EmailAddress, // Send to single recipient
                    subject: subject,
                    body: body,
                    cclist: '' // Empty cclist to avoid any separator issues
                });
                return { success: true, email: recipient.EmailAddress };
            } catch (error) {
                console.error(`Failed to send email to ${recipient.EmailAddress}:`, error);
                return { success: false, email: recipient.EmailAddress, error: error.message };
            }
        });

        const emailResults = await Promise.all(emailPromises);

        // Log the email attempt
        await pool.request()
            .input('auditId', sql.Int, auditId)
            .input('recipients', sql.NVarChar, recipientsResult.recordset.map(r => r.EmailAddress).join(', '))
            .input('subject', sql.NVarChar, subject)
            .input('status', sql.NVarChar, 'Sent')
            .input('errorMessage', sql.NVarChar, null)
            .query(`
                INSERT INTO EmailLog (AuditId, Recipients, Subject, Status, ErrorMessage, SentDate)
                VALUES (@auditId, @recipients, @subject, @status, @errorMessage, GETDATE())
            `);

        // Check if any emails failed
        const failedEmails = emailResults.filter(result => !result.success);
        if (failedEmails.length > 0) {
            res.status(207).json({
                message: 'Some emails failed to send',
                results: emailResults
            });
        } else {
            res.status(200).json({
                message: 'All emails sent successfully',
                results: emailResults
            });
        }

    } catch (error) {
        console.error("Error in sendEmailNotification:", error);
        
        // Log failed email attempt
        try {
            const pool = await connectDB();
            await pool.request()
                .input('auditId', sql.Int, parsedEmailData?.auditId)
                .input('recipients', sql.NVarChar, 'Error occurred before sending')
                .input('subject', sql.NVarChar, 'FCA Failure Notification')
                .input('status', sql.NVarChar, 'Failed')
                .input('errorMessage', sql.NVarChar, error.message)
                .query(`
                    INSERT INTO EmailLog (AuditId, Recipients, Subject, Status, ErrorMessage, SentDate)
                    VALUES (@auditId, @recipients, @subject, @status, @errorMessage, GETDATE())
                `);
        } catch (logError) {
            console.error("Error logging email failure:", logError);
        }

        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getEmailRecipients,
    sendEmailNotification
};