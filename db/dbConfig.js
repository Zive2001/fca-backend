const sql = require("mssql");
const dotenv = require("dotenv")
dotenv.config()

const dbConfig = {
    user: process.env.DB_USER || 'usrfca',
    password: process.env.DB_PASSWORD || 'uFca*^zvhQH*Ara',
    server: process.env.DB_SERVER || 'sg-prod-bdydbs1.database.windows.net',
    database: process.env.DB_NAME || 'SG-PROD-BDYDB-FCA',
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true
    },
    requestTimeout: 60000,
    connectionTimeout: 30000,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
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
