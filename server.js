const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fcaRoutes = require("./routes/fcaRoutes");
const dotenv = require("dotenv")
dotenv.config()

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());
app.use("/api/fca", fcaRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
