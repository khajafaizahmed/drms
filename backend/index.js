const { getDbConnection } = require('./config');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// Railway sits behind one proxy; needed so rate limiting sees the real client IP.
app.set('trust proxy', 1);

// ALLOWED_ORIGINS="https://a.example,https://b.example" limits which sites can call the API
// from a browser. Unset = allow any origin (previous behaviour).
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : {}));

app.use(express.json({ limit: '50kb' }));

// Basic abuse protection: generous for reads, tighter for anything that changes data.
app.use(rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
const writeLimiter = rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false });
app.use((req, res, next) => (['POST', 'PUT', 'DELETE'].includes(req.method) ? writeLimiter(req, res, next) : next()));

let dbConnection;

(async () => {
    try {
        dbConnection = await getDbConnection();
        console.log("✅ Connected to DB");

        const PORT = process.env.PORT || 2000;
        app.listen(PORT, () => {
            console.log("🚀 Express server is running and listening on port " + PORT);
        });
    } catch (err) {
        console.error("❌ Failed to connect to the database:", err.message);
        process.exit(1); // Stop app if DB fails
    }
})();

// ---------- input validation ----------

class BadInput extends Error {}

// A finite number (accepts numeric strings), optionally within [min, max].
function num(value, name, { min = -Infinity, max = Infinity } = {}) {
    const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max) {
        throw new BadInput(`${name} must be a number${Number.isFinite(min) ? ` between ${min} and ${max}` : ''}`);
    }
    return n;
}

// A positive integer id.
function id(value, name = 'id') {
    const n = num(value, name, { min: 1, max: Number.MAX_SAFE_INTEGER });
    if (!Number.isInteger(n)) throw new BadInput(`${name} must be a whole number`);
    return n;
}

function text(value, name, max = 255) {
    if (typeof value !== 'string' || value.length === 0 || value.length > max) {
        throw new BadInput(`${name} must be text up to ${max} characters`);
    }
    return value;
}

function optionalText(value, name, max = 1000) {
    return value === undefined || value === null || value === '' ? '' : text(value, name, max);
}

// A date or datetime string the database can compare against.
function date(value, name) {
    if (typeof value !== 'string' || value.length > 40 || Number.isNaN(Date.parse(value))) {
        throw new BadInput(`${name} must be a date`);
    }
    return value;
}

function location(body) {
    const loc = body && body.location;
    if (!loc) throw new BadInput('location is required');
    return [num(loc.x, 'location.x', { min: -1000, max: 1000 }), num(loc.y, 'location.y', { min: -90, max: 90 })];
}

// Send a safe error. Details go to the server log only, never to the client.
function fail(res, err, status = 400, message = 'Request failed') {
    if (err instanceof BadInput) return res.status(400).json({ error: err.message });
    console.error(err);
    return res.status(status).json({ error: message });
}

// ---------- routes ----------

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
        fail(res, err, 500, 'Database error');
    }
});

// Add new incident
// POINT(?, ?) builds the geometry from two bound numbers. The old
// ST_GeomFromText('POINT(? ?)') put placeholders inside a quoted string, which
// let a crafted location break out of the string (SQL injection).
app.post('/add-incident', async (req, res) => {
    const sqlQuery = "INSERT INTO incidents (location, radius, incident_type) VALUES (POINT(?, ?), ?, ?)";
    const selectQuery = "SELECT i.id, i.location, i.radius, i.incident_type, i.start_date, i.end_date, it.name, it.color, it.icon FROM incidents i JOIN incident_type it ON i.incident_type = it.id WHERE i.id = ?;";

    try {
        const [x, y] = location(req.body);
        const values = [x, y, num(req.body.radius, 'radius', { min: 0, max: 1e7 }), id(req.body.type, 'type')];
        const [insertResult] = await dbConnection.query(sqlQuery, values);
        const [incident] = await dbConnection.query(selectQuery, [insertResult.insertId]);
        res.status(200).json(incident);
    } catch (err) {
        fail(res, err, 400, 'Failed to add incident');
    }
});

// Add new resource
app.post('/add-resource', async (req, res) => {
    const sqlQuery = "INSERT INTO resources (location, quantity, resource_type) VALUES (POINT(?, ?), ?, ?)";
    const selectQuery = "SELECT r.id, r.location, r.resource_type, rt.name, rt.color, rt.icon, rt.description FROM resources r JOIN resource_type rt ON r.resource_type = rt.id WHERE r.id = ?;";

    try {
        const [x, y] = location(req.body);
        const values = [x, y, num(req.body.quantity, 'quantity', { min: 0, max: 1e9 }), id(req.body.type, 'type')];
        const [insertResult] = await dbConnection.query(sqlQuery, values);
        const [resource] = await dbConnection.query(selectQuery, [insertResult.insertId]);
        res.status(200).json(resource);
    } catch (err) {
        fail(res, err, 400, 'Failed to add resource');
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
        fail(res, err, 500, 'Database error');
    }
});

// GET/DELETE single incident
app.route('/api/incidents/:id')
    .get(async (req, res) => {
        try {
            const [result] = await dbConnection.query("SELECT * FROM incidents WHERE id = ?", [id(req.params.id)]);
            res.json(result[0]);
        } catch (err) {
            fail(res, err, 500, 'Database error');
        }
    })
    .delete(async (req, res) => {
        try {
            await dbConnection.query("DELETE FROM incidents WHERE id = ?", [id(req.params.id)]);
            res.sendStatus(204);
        } catch (err) {
            fail(res, err, 500, 'Failed to delete incident');
        }
    });

// GET/DELETE single resource
app.route('/api/resources/:id')
    .get(async (req, res) => {
        try {
            const [result] = await dbConnection.query("SELECT * FROM resources WHERE id = ?", [id(req.params.id)]);
            res.json(result[0]);
        } catch (err) {
            fail(res, err, 500, 'Database error');
        }
    })
    .delete(async (req, res) => {
        try {
            await dbConnection.query("DELETE FROM resources WHERE id = ?", [id(req.params.id)]);
            res.sendStatus(204);
        } catch (err) {
            fail(res, err, 500, 'Failed to delete resource');
        }
    });

// Link resource to incident
app.post('/api/connection', async (req, res) => {
    const sqlQuery = "INSERT INTO incident_resources (incident_id, resource_id) VALUES (?, ?);";

    try {
        const values = [id(req.body.incident_id, 'incident_id'), id(req.body.resource_id, 'resource_id')];
        await dbConnection.query(sqlQuery, values);
        res.status(200).json({ Status: 'Ok' });
    } catch (err) {
        fail(res, err, 400, 'Failed to link resource');
    }
});

// Unlink resource from incident
app.delete('/api/connection/:incident_id/:resource_id', async (req, res) => {
    try {
        await dbConnection.query(
            "DELETE FROM incident_resources WHERE incident_id = ? AND resource_id = ?;",
            [id(req.params.incident_id, 'incident_id'), id(req.params.resource_id, 'resource_id')]
        );
        res.sendStatus(204);
    } catch (err) {
        fail(res, err, 500, 'Failed to delete connection');
    }
});

// Incident type CRUD
app.route('/api/incident-types')
    .get(async (req, res) => {
        try {
            const [results] = await dbConnection.query("SELECT * FROM incident_type");
            res.json(results);
        } catch (err) {
            fail(res, err, 500, 'Database error');
        }
    })
    .post(async (req, res) => {
        try {
            const name = text(req.body.name, 'name', 256);
            const color = text(req.body.color, 'color', 256);
            const icon = text(req.body.icon, 'icon', 256);
            const [result] = await dbConnection.query("INSERT INTO incident_type (name, color, icon) VALUES (?, ?, ?)", [name, color, icon]);
            res.status(201).json({ id: result.insertId, name, color, icon });
        } catch (err) {
            fail(res, err, 500, 'Failed to create incident type');
        }
    });

app.route('/api/incident-types/:id')
    .get(async (req, res) => {
        try {
            const [result] = await dbConnection.query("SELECT * FROM incident_type WHERE id = ?", [id(req.params.id)]);
            res.json(result[0]);
        } catch (err) {
            fail(res, err, 500, 'Database error');
        }
    })
    .put(async (req, res) => {
        try {
            const name = text(req.body.name, 'name', 256);
            const color = text(req.body.color, 'color', 256);
            const icon = text(req.body.icon, 'icon', 256);
            await dbConnection.query("UPDATE incident_type SET name = ?, color = ?, icon = ? WHERE id = ?", [name, color, icon, id(req.params.id)]);
            res.sendStatus(200);
        } catch (err) {
            fail(res, err, 500, 'Failed to update incident type');
        }
    })
    .delete(async (req, res) => {
        try {
            await dbConnection.query("DELETE FROM incident_type WHERE id = ?", [id(req.params.id)]);
            res.sendStatus(204);
        } catch (err) {
            fail(res, err, 500, 'Failed to delete incident type');
        }
    });

// Resource type CRUD
app.route('/api/resource-types')
    .get(async (req, res) => {
        try {
            const [results] = await dbConnection.query("SELECT * FROM resource_type");
            res.json(results);
        } catch (err) {
            fail(res, err, 500, 'Database error');
        }
    })
    .post(async (req, res) => {
        try {
            const name = text(req.body.name, 'name', 256);
            const color = text(req.body.color, 'color', 256);
            const icon = text(req.body.icon, 'icon', 256);
            const description = optionalText(req.body.description, 'description', 5000);
            const [result] = await dbConnection.query("INSERT INTO resource_type (name, color, icon, description) VALUES (?, ?, ?, ?)", [name, color, icon, description]);
            res.status(201).json({ id: result.insertId, name, color, icon, description });
        } catch (err) {
            fail(res, err, 500, 'Failed to create resource type');
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

    try {
        const incidentId = id(req.params.id);
        const [results] = await dbConnection.query(sqlQuery, [incidentId, incidentId]);
        res.status(200).json({ resources: results });
    } catch (err) {
        fail(res, err, 400, 'Analysis failed');
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
        const minConnections = num(req.body.min_connection_num, 'min_connection_num', { min: 0, max: 1e6 });
        const [results] = await dbConnection.query(sqlQuery, [minConnections]);
        res.status(200).json(results);
    } catch (err) {
        fail(res, err, 400, 'Query failed');
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
        const values = [num(req.body.radius, 'radius', { min: 0, max: 2.1e7 }), id(req.body.incident_id, 'incident_id')];
        const [results] = await dbConnection.query(sqlQuery, values);
        res.status(200).json(results);
    } catch (err) {
        fail(res, err, 400, 'Query failed');
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
        const start = date(req.body.start, 'start');
        const [results] = await dbConnection.query(sqlQuery, [start, start]);
        res.status(200).json(results);
    } catch (err) {
        fail(res, err, 400, 'Query failed');
    }
});

// Malformed JSON bodies and oversize requests: answer cleanly instead of with a stack trace.
app.use((err, req, res, next) => {
    if (err && (err.type === 'entity.parse.failed' || err.type === 'entity.too.large')) {
        return res.status(err.status || 400).json({ error: 'Invalid request body' });
    }
    return fail(res, err, 500, 'Server error');
});

module.exports = app;
