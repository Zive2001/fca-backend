const express = require('express');
const router = express.Router();
const { 
    addAdminUser, 
    getAdminUsers, 
    removeAdminUser 
} = require('../controllers/adminController');

// Middleware to validate Azure AD authentication
const validateAzureAuth = (req, res, next) => {
    const userEmail = req.headers['x-ms-client-principal-name'];
    
    if (!userEmail) {
        console.log('Missing authentication header');
        return res.status(401).json({ 
            error: 'Authentication required',
            details: 'No Azure AD principal found'
        });
    }
    
    // Add the email to the request object for use in routes
    req.userEmail = userEmail;
    next();
};

// Middleware to ensure admin access
const ensureAdmin = async (req, res, next) => {
    try {
        const userEmail = req.userEmail; // Use the email from validateAzureAuth
        const { connectDB, sql } = require('../db/dbConfig');
        const pool = await connectDB();
        
        const result = await pool.request()
            .input('email', sql.NVarChar, userEmail)
            .query('SELECT Email FROM AdminUsers WHERE Email = @email AND IsActive = 1');

        if (result.recordset.length === 0) {
            return res.status(403).json({ 
                error: 'Admin access required',
                details: 'User is not authorized as admin'
            });
        }
        
        next();
    } catch (error) {
        console.error('Error in admin middleware:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
};

// Apply validateAzureAuth middleware to all routes
router.use(validateAzureAuth);

// Check admin status route
router.get('/check/:email', async (req, res) => {
    const { email } = req.params;
    const authenticatedUser = req.userEmail;
    
    console.log('Checking admin status:', {
        requestedEmail: email,
        authenticatedUser: authenticatedUser
    });

    try {
        const { connectDB, sql } = require('../db/dbConfig');
        const pool = await connectDB();
        
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query(`
                SELECT Email, IsActive 
                FROM AdminUsers 
                WHERE Email = @email AND IsActive = 1
            `);

        const isAdmin = result.recordset.length > 0;
        
        console.log('Admin check result:', {
            email,
            isAdmin,
            recordCount: result.recordset.length
        });

        res.json({ 
            isAdmin,
            email,
            authenticated: true
        });
    } catch (error) {
        console.error('Database error in admin check:', error);
        res.status(500).json({ 
            error: 'Failed to check admin status',
            details: error.message
        });
    }
});

// Protected admin routes - require both authentication and admin access
router.post('/add', ensureAdmin, addAdminUser);
router.get('/users', ensureAdmin, getAdminUsers);
router.delete('/remove/:email', ensureAdmin, removeAdminUser);

// Add debug endpoint to check authentication
router.get('/auth-debug', (req, res) => {
    res.json({
        authenticated: true,
        userEmail: req.userEmail,
        headers: {
            ...req.headers,
            // Remove any sensitive information
            authorization: req.headers.authorization ? '[REDACTED]' : undefined
        }
    });
});

module.exports = router;