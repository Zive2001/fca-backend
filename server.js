const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer"); // Add this for handling multipart/form-data
const fcaRoutes = require("./routes/fcaRoutes");
const uploadRoutes = require("./routes/uploadroutes");
const photoRoutes = require("./routes/photoRoutes");
const emailRoutes = require("./routes/emailRoutes");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Routes
app.use("/api/fca", fcaRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/fca/photos", photoRoutes);
app.use("/api/email", emailRoutes); // Changed to match frontend URL

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something broke!' });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});