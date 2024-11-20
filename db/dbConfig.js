const sql = require("mssql");
const dotenv = require("dotenv")
dotenv.config()


const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false, // For Azure SQL
        enableArithAbort: true,
    },
};

const connectDB = async () => {
    try {
        const pool = await sql.connect(dbConfig);
        console.log("Connected to the database.");
        return pool;
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = { connectDB, sql };
