//server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const fcaRoutes = require("./routes/fcaRoutes");
const uploadRoutes = require("./routes/uploadroutes");
const photoRoutes = require("./routes/photoRoutes");
const emailRoutes = require("./routes/emailRoutes");
const dotenv = require("dotenv");
const { connectDB } = require("./db/dbConfig");

// Startup logging
console.log("Starting application...");
console.log("Node version:", process.version);
console.log("Current directory:", process.cwd());

dotenv.config();
console.log("Environment variables loaded");

// Log environment variables (excluding sensitive data)
console.log("PORT:", process.env.PORT);
console.log("DB_SERVER:", process.env.DB_SERVER);
console.log("DB_NAME:", process.env.DB_NAME);

const app = express();
const PORT = process.env.PORT || 8080;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// CORS configuration for Azure
const corsOptions = {
    origin: [
        'http://localhost:5174',  // Add your local frontend URL
        'https://sg-prod-bdyapp-fcafront.azurewebsites.net'  // Keep production URL
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
console.log("Setting up middleware...");

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors(corsOptions));

console.log("Setting up routes...");

// Routes
app.use("/api/fca", fcaRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/fca/photos", photoRoutes);
app.use("/api/fca/email", emailRoutes);

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