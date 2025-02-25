const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const fcaRoutes = require("./routes/fcaRoutes");
const uploadRoutes = require("./routes/uploadroutes");
const photoRoutes = require("./routes/photoRoutes");
const emailRoutes = require("./routes/emailRoutes");
const reportRoutes = require("./routes/reportRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes"); // Add this line
const dotenv = require("dotenv");
const { connectDB } = require("./db/dbConfig");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Updated CORS configuration
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'https://sg-prod-bdyapp-fcafront.azurewebsites.net'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'X-MS-CLIENT-PRINCIPAL-NAME',
        'X-MS-CLIENT-PRINCIPAL-ID',
        'Cache-Control',
        'Pragma',
        'Accept',
        'Origin' 
    ],
    exposedHeaders: ['Content-Disposition']
};

// Apply CORS before other middleware
app.use(cors(corsOptions));

// Additional headers middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, x-ms-client-principal-name');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
});

// Other middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Azure AD authentication middleware
app.use((req, res, next) => {
    // Extract Azure AD user information if available
    const azureUser = req.headers['x-ms-client-principal-name'];
    if (azureUser) {
        req.user = {
            email: azureUser
        };
    }
    next();
});

// Routes
app.use("/api/fca", fcaRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/fca/photos", photoRoutes);
app.use("/api/fca/email", emailRoutes);
app.use("/api/fca/reports", reportRoutes);
app.use("/api/fca/analytics", dashboardRoutes);
app.use("/api/fca/admin", adminRoutes); // Add admin routes

// Basic route for testing
app.get("/", (req, res) => {
    res.json({ message: "Backend server is running" });
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ 
        status: "healthy",
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage()
    });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
    console.error("Error occurred:", new Date().toISOString());
    console.error("Error message:", err.message);
    console.error("Stack trace:", err.stack);
    console.error("Request details:", {
        method: req.method,
        path: req.path,
        query: req.query,
        headers: req.headers,
    });

    // Special handling for admin-related errors
    if (err.name === 'AdminAuthorizationError') {
        return res.status(403).json({
            error: 'Admin access required',
            timestamp: new Date().toISOString()
        });
    }

    res.status(500).json({ 
        error: err.message || 'Something broke!',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    });
});

// Handle 404 errors
app.use((req, res) => {
    console.log(`404 - Route not found: ${req.method} ${req.path}`);
    res.status(404).json({ error: 'Route not found' });
});

// Wrap the server startup in a try-catch
const startServer = async () => {
    try {
        console.log("Testing database connection...");
        await connectDB();
        console.log("Database connection successful");

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log("Server startup complete");
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        process.exit(1);
    }
};

startServer();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection:', reason);
    process.exit(1);
});