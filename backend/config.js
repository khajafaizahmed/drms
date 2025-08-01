import mysql from 'mysql2/promise';


const mysqlConfig = {
    host: "localhost", 
    port: 3306,
    user: "testuser", 
    password: "mypassword",
    database: "drms",
    debug: true // Connection debugging mode is ON
};


export async function getDbConnection() {
    return await mysql.createConnection(mysqlConfig);
}
