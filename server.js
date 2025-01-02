const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fcaRoutes = require("./routes/fcaRoutes");
const uploadRoutes = require("./routes/uploadroutes");
const photoRoutes = require("./routes/photoRoutes"); // Add this import
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Increase payload limit for photo uploads
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Routes
app.use("/api/fca", fcaRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/fca/photos", photoRoutes);// Add the photo routes

// app.js or server.js
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' })); 
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).send('Route not found');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});