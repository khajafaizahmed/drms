const mysql = require('mysql2/promise');

const mysqlConfig = {
    host: process.env.MYSQLHOST || "localhost",
    port: process.env.MYSQLPORT || 3306,
    user: process.env.MYSQLUSER || "testuser",
    password: process.env.MYSQLPASSWORD || "mypassword",
    database: process.env.MYSQLDATABASE || "drms",
    debug: true
};

async function getDbConnection() {
    return await mysql.createConnection(mysqlConfig);
}

module.exports = { getDbConnection };
