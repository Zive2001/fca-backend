//adminController.js

const { connectDB, sql } = require("../db/dbConfig");

// Check if a user is an admin
const checkAdminStatus = async (req, res) => {
    const { email } = req.params;
    
    try {
        const pool = await connectDB();
        const result = await pool.request()
            .input("email", sql.NVarChar, email)
            .query(`
                SELECT Email, IsActive 
                FROM AdminUsers 
                WHERE Email = @email AND IsActive = 1
            `);

        if (result.recordset.length > 0) {
            res.status(200).json({ 
                isAdmin: true,
                email: result.recordset[0].Email
            });
        } else {
            res.status(200).json({ 
                isAdmin: false,
                email: email
            });
        }
    } catch (error) {
        console.error("Error in checkAdminStatus:", error);
        res.status(500).json({ 
            error: error.message,
            isAdmin: false
        });
    }
};

// Add a new admin user
const addAdminUser = async (req, res) => {
    const { email, createdBy } = req.body;
    
    try {
        const pool = await connectDB();
        const result = await pool.request()
            .input("email", sql.NVarChar, email)
            .input("createdBy", sql.NVarChar, createdBy)
            .query(`
                IF NOT EXISTS (SELECT 1 FROM AdminUsers WHERE Email = @email)
                BEGIN
                    INSERT INTO AdminUsers (Email, CreatedBy)
                    VALUES (@email, @createdBy);
                    SELECT SCOPE_IDENTITY() as Id;
                END
                ELSE
                    THROW 50000, 'Admin user already exists', 1;
            `);

        res.status(201).json({ 
            message: "Admin user added successfully",
            id: result.recordset[0].Id
        });
    } catch (error) {
        console.error("Error in addAdminUser:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get all admin users
const getAdminUsers = async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request()
            .query(`
                SELECT Email, CreatedAt, CreatedBy, IsActive
                FROM AdminUsers
                ORDER BY CreatedAt DESC
            `);

        res.status(200).json(result.recordset);
    } catch (error) {
        console.error("Error in getAdminUsers:", error);
        res.status(500).json({ error: error.message });
    }
};

// Remove admin user
const removeAdminUser = async (req, res) => {
    const { email } = req.params;
    
    try {
        const pool = await connectDB();
        await pool.request()
            .input("email", sql.NVarChar, email)
            .query(`
                UPDATE AdminUsers 
                SET IsActive = 0 
                WHERE Email = @email
            `);

        res.status(200).json({ 
            message: "Admin user removed successfully" 
        });
    } catch (error) {
        console.error("Error in removeAdminUser:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    checkAdminStatus,
    addAdminUser,
    getAdminUsers,
    removeAdminUser
};