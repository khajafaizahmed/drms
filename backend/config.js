const express = require('express');
const cors = require('cors');
const { getDbConnection } = require('./config');

const app = express();
app.use(cors());
app.use(express.json());

// Example route
app.get('/api/incidents', async (req, res) => {
    try {
        const db = await getDbConnection();
        const [rows] = await db.query("SELECT * FROM incidents");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Error' });
    }
});

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
});
