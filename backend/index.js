const { getDbConnection } = require('./config');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

let dbConnection;

(async () => {
    dbConnection = await getDbConnection();
})();

// Fetch all data
app.get('/get-data', async (req, res) => {
    const sqlIncidentsQuery = "SELECT i.id, i.location, i.radius, i.incident_type, i.start_date, i.end_date, it.name, it.color, it.icon FROM incidents i JOIN incident_type it ON i.incident_type = it.id;";
    const sqlResourcesQuery = "SELECT r.id, r.location, r.resource_type, r.quantity, rt.name, rt.color, rt.icon, rt.description FROM resources r JOIN resource_type rt ON r.resource_type = rt.id;";
    const sqlIncidentResourcesQuery = "SELECT * FROM incident_resources";

    try {
        const [incidentsResults] = await dbConnection.query(sqlIncidentsQuery);
        const [sqlResourcesResults] = await dbConnection.query(sqlResourcesQuery);
        const [sqlIncidentResourcesResults] = await dbConnection.query(sqlIncidentResourcesQuery);

        res.status(200).json({
            incidents: incidentsResults,
            resources: sqlResourcesResults,
            incident_resources: sqlIncidentResourcesResults
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({ Error: err });
    }
});

// Add new incident
app.post('/add-incident', async (req, res) => {
    const sqlQuery = "INSERT INTO incidents (location, radius, incident_type) VALUES (ST_GeomFromText('POINT(? ?)'), ?, ?)";
    const selectQuery = "SELECT i.id, i.location, i.radius, i.incident_type, i.start_date, i.end_date, it.name, it.color, it.icon FROM incidents i JOIN incident_type it ON i.incident_type = it.id WHERE i.id = ?;";
    const values = [req.body.location.x, req.body.location.y, req.body.radius, req.body.type];

    try {
        const [insertResult] = await dbConnection.query(sqlQuery, values);
        const [incident] = await dbConnection.query(selectQuery, [insertResult.insertId]);
        res.status(200).json(incident);
    } catch (err) {
        console.error(err);
        res.status(400).json({ Error: err });
    }
});

// Add new resource
app.post('/add-resource', async (req, res) => {
    const sqlQuery = "INSERT INTO resources (location, quantity, resource_type) VALUES (ST_GeomFromText('POINT(? ?)'), ?, ?)";
    const selectQuery = "SELECT r.id, r.location, r.resource_type, rt.name, rt.color, rt.icon, rt.description FROM resources r JOIN resource_type rt ON r.resource_type = rt.id WHERE r.id = ?;";
    const values = [req.body.location.x, req.body.location.y, req.body.quantity, req.body.type];

    try {
        const [insertResult] = await dbConnection.query(sqlQuery, values);
        const [resource] = await dbConnection.query(selectQuery, [insertResult.insertId]);
        res.status(200).json(resource);
    } catch (err) {
        console.error(err);
        res.status(400).json({ Error: err });
    }
});

// GET all incidents
app.get('/api/incidents', async (req, res) => {
    const sqlQuery = `
        SELECT 
            i.id, i.location, i.radius, 
            i.incident_type, it.name as incident_name, 
            it.color as color,
            it.icon as icon,
            i.start_date, i.end_date
        FROM incidents i
        JOIN incident_type it ON it.id = i.incident_type
    `;
    try {
        const [result] = await dbConnection.query(sqlQuery);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// GET/DELETE single incident
app.route('/api/incidents/:id')
    .get(async (req, res) => {
        try {
            const [result] = await dbConnection.query("SELECT * FROM incidents WHERE id = ?", [req.params.id]);
            res.json(result[0]);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Database error" });
        }
    })
    .delete(async (req, res) => {
        try {
            await dbConnection.query("DELETE FROM incidents WHERE id = ?", [req.params.id]);
            res.sendStatus(204);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Failed to delete incident" });
        }
    });

// GET/DELETE single resource
app.route('/api/resources/:id')
    .get(async (req, res) => {
        try {
            const [result] = await dbConnection.query("SELECT * FROM resources WHERE id = ?", [req.params.id]);
            res.json(result[0]);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Database error" });
        }
    })
    .delete(async (req, res) => {
        try {
            await dbConnection.query("DELETE FROM resources WHERE id = ?", [req.params.id]);
            res.sendStatus(204);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Failed to delete resource" });
        }
    });

// Link resource to incident
app.post('/api/connection', async (req, res) => {
    const sqlQuery = "INSERT INTO incident_resources (incident_id, resource_id) VALUES (?, ?);";
    const values = [req.body.incident_id, req.body.resource_id];

    try {
        await dbConnection.query(sqlQuery, values);
        res.status(200).json({ Status: 'Ok' });
    } catch (err) {
        console.error(err);
        res.status(400).json({ Error: err });
    }
});

// Unlink resource from incident
app.delete('/api/connection/:incident_id/:resource_id', async (req, res) => {
    try {
        await dbConnection.query("DELETE FROM incident_resources WHERE incident_id = ? AND resource_id = ?;", [req.params.incident_id, req.params.resource_id]);
        res.sendStatus(204);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete connection" });
    }
});

// Incident type CRUD
app.route('/api/incident-types')
    .get(async (req, res) => {
        try {
            const [results] = await dbConnection.query("SELECT * FROM incident_type");
            res.json(results);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Database error" });
        }
    })
    .post(async (req, res) => {
        const { name, color, icon } = req.body;
        try {
            const [result] = await dbConnection.query("INSERT INTO incident_type (name, color, icon) VALUES (?, ?, ?)", [name, color, icon]);
            res.status(201).json({ id: result.insertId, name, color, icon });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Failed to create incident type" });
        }
    });

app.route('/api/incident-types/:id')
    .get(async (req, res) => {
        try {
            const [result] = await dbConnection.query("SELECT * FROM incident_type WHERE id = ?", [req.params.id]);
            res.json(result[0]);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Database error" });
        }
    })
    .put(async (req, res) => {
        const { name, color, icon } = req.body;
        try {
            await dbConnection.query("UPDATE incident_type SET name = ?, color = ?, icon = ? WHERE id = ?", [name, color, icon, req.params.id]);
            res.sendStatus(200);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Failed to update incident type" });
        }
    })
    .delete(async (req, res) => {
        try {
            await dbConnection.query("DELETE FROM incident_type WHERE id = ?", [req.params.id]);
            res.sendStatus(204);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Failed to delete incident type" });
        }
    });

// Resource type CRUD
app.route('/api/resource-types')
    .get(async (req, res) => {
        try {
            const [results] = await dbConnection.query("SELECT * FROM resource_type");
            res.json(results);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Database error" });
        }
    })
    .post(async (req, res) => {
        const { name, color, icon, description } = req.body;
        try {
            const [result] = await dbConnection.query("INSERT INTO resource_type (name, color, icon, description) VALUES (?, ?, ?, ?)", [name, color, icon, description]);
            res.status(201).json({ id: result.insertId, name, color, icon, description });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Failed to create resource type" });
        }
    });

// Analysis and advanced queries
app.get('/api/incident-resource-analysis/:id', async (req, res) => {
    const sqlQuery = `
        WITH connected AS (
            SELECT r.resource_type, SUM(r.quantity) as quantity
            FROM incident_resources ir
            JOIN resources r ON r.id = ir.resource_id
            WHERE ir.incident_id = ?
            GROUP BY r.resource_type
        )
        SELECT 
            itr.resource_type, 
            rt.name,
            rt.icon,
            itr.quantity as quantity_needed,
            itr.required,
            COALESCE(c.quantity, 0) as quantity_provided,
            CASE itr.required 
                WHEN 0 THEN 1 
                ELSE COALESCE(c.quantity - itr.quantity >= 0, 0)
            END AS satisfied
        FROM incidents i 
        JOIN incident_type_resources itr ON itr.incident_type = i.incident_type
        LEFT JOIN connected c ON c.resource_type = itr.resource_type
        JOIN resource_type rt on rt.id = itr.resource_type
        WHERE i.id = ?
        ORDER BY itr.required DESC;
    `;

    const values = [req.params.id, req.params.id];

    try {
        const [results] = await dbConnection.query(sqlQuery, values);
        res.status(200).json({ resources: results });
    } catch (err) {
        console.error(err);
        res.status(400).json({ Error: err });
    }
});

app.post('/api/entity-connection-num', async (req, res) => {
    const sqlQuery = `
        SELECT * FROM (
            SELECT CONCAT("i", i.id) as id, location, it.name, it.color, it.icon,
                (SELECT COUNT(*) FROM incident_resources ir WHERE ir.incident_id = i.id) as ConnectionNum
            FROM incidents i
            JOIN incident_type it ON i.incident_type = it.id
            UNION
            SELECT CONCAT("r", r.id) as id, location, rt.name, rt.color, rt.icon,
                (SELECT COUNT(*) FROM incident_resources ir WHERE ir.resource_id = r.id) as ConnectionNum
            FROM resources r
            JOIN resource_type rt ON r.resource_type = rt.id ) AS r
        WHERE r.ConnectionNum >= ?;
    `;

    try {
        const [results] = await dbConnection.query(sqlQuery, [req.body.min_connection_num]);
        res.status(200).json(results);
    } catch (err) {
        console.error(err);
        res.status(400).json({ Error: err });
    }
});

app.post('/api/incident-resouces-in-radius', async (req, res) => {
    const sqlQuery = `
        SELECT 
            r.id AS id, r.location AS location,
            rt.name, rt.color, rt.description, rt.icon,
            ST_DISTANCE_SPHERE(i.location, r.location) AS distance
        FROM incidents AS i
        JOIN resources AS r ON ST_DISTANCE_SPHERE(i.location, r.location) <= ?
        JOIN resource_type rt ON rt.id = r.resource_type
        WHERE i.id = ?
        ORDER BY distance ASC;
    `;

    try {
        const [results] = await dbConnection.query(sqlQuery, [req.body.radius, req.body.incident_id]);
        res.status(200).json(results);
    } catch (err) {
        console.error(err);
        res.status(400).json({ Error: err });
    }
});

app.post('/api/incident-by-date', async (req, res) => {
    const sqlQuery = `
        SELECT 
            i.id as id, i.location, i.radius, it.name as type, it.icon,
            i.start_date, i.end_date
        FROM incidents i
        JOIN incident_type it on i.incident_type = it.id
        WHERE i.start_date <= ? AND (i.end_date IS NULL OR i.end_date >= ?);
    `;

    try {
        const [results] = await dbConnection.query(sqlQuery, [req.body.start, req.body.start]);
        res.status(200).json(results);
    } catch (err) {
        console.error(err);
        res.status(400).json({ Error: err });
    }
});

// ✅ Start the Express server
const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
    console.log("Express server is running and listening on port " + PORT);
});
