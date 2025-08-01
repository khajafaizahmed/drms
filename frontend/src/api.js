const BASE_URL = "https://drms-backend.up.railway.app";

function getIncidents(onSuccess, onFailure) {
    fetch(`${BASE_URL}/api/incidents`)
        .then(response => response.json())
        .then(json => onSuccess(json))
        .catch(error => onFailure(error));
}

function getIndicentResourceAnalysis(incidentId, onSuccess, onFailure) {
    fetch(`${BASE_URL}/api/incident-resource-analysis/${incidentId}`)
        .then(response => response.json())
        .then(json => onSuccess(json))
        .catch(error => onFailure(error));
}

function getEntityConnectionNum(minConnectionNum, onSuccess, onFailure) {
    fetch(`${BASE_URL}/api/entity-connection-num`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            min_connection_num: minConnectionNum
        })
    })
        .then(response => response.json())
        .then(json => onSuccess(json))
        .catch(error => onFailure(error));
}

function getResourcesInRadius(incidentId, radius, onSuccess, onFailure) {
    fetch(`${BASE_URL}/api/incident-resouces-in-radius`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            incident_id: incidentId,
            radius: radius
        })
    })
        .then(response => response.json())
        .then(json => onSuccess(json))
        .catch(error => onFailure(error));
}

function dateToSql(date) {
    return date.toISOString().slice(0, 10);
}

function getIncidentsByDate(start, end, onSuccess, onFailure) {
    fetch(`${BASE_URL}/api/incident-by-date`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            start: dateToSql(start),
            end: dateToSql(end)
        })
    })
        .then(response => response.json())
        .then(json => onSuccess(json))
        .catch(error => onFailure(error));
}

export {
    getIncidents,
    getIndicentResourceAnalysis,
    getEntityConnectionNum,
    getResourcesInRadius,
    getIncidentsByDate
};
