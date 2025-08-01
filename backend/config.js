const mysql = require('mysql2/promise');

const mysqlConfig = {
    host: process.env.MYSQLHOST,
    port: process.env.MYSQLPORT,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    debug: true
};

async function getDbConnection() {
    return await mysql.createConnection(mysqlConfig);
}

module.exports = { getDbConnection };
