const express = require('express');
const router = express.Router();
const { 
    checkAdminStatus, 
    addAdminUser, 
    getAdminUsers, 
    removeAdminUser 
} = require('../controllers/adminController');

// Middleware to validate request
const validateRequest = (req, res, next) => {
    // Check if user is authenticated via Azure AD
    if (!req.headers['x-ms-client-principal-name']) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    next();
};

// Middleware to ensure admin access
const ensureAdmin = async (req, res, next) => {
    try {
        const userEmail = req.headers['x-ms-client-principal-name'];
        const { connectDB, sql } = require('../db/dbConfig');
        const pool = await connectDB();
        
        const result = await pool.request()
            .input('email', sql.NVarChar, userEmail)
            .query('SELECT Email FROM AdminUsers WHERE Email = @email AND IsActive = 1');

        if (result.recordset.length === 0) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        next();
    } catch (error) {
        console.error('Error in admin middleware:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Routes
router.get('/check/:email', validateRequest, checkAdminStatus);

// Protected admin routes
router.post('/add', [validateRequest, ensureAdmin], addAdminUser);
router.get('/users', [validateRequest, ensureAdmin], getAdminUsers);
router.delete('/remove/:email', [validateRequest, ensureAdmin], removeAdminUser);

module.exports = router;