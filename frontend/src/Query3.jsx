import { getIncidents, getResourcesInRadius } from './api';
import React, { useState, useEffect, useMemo } from 'react';

import { getIcon } from './utils';

export default function Query3() {
    const [incidents, setIncidents] = useState([]);
    const [incident, setIncident] = useState(null);
    const [resources, setResources] = useState([]);

    useEffect(() => {
        getIncidents(data => setIncidents(data), error => console.log(error));
    }, []);

    function onRadiusChanged(e) {
        var r = e.target.value;

        if (!r) {
            r = '0';
        }

        if (incident === null) {
            return;
        }

        const _r = getMeters(parseFloat(r));

        getResourcesInRadius(incident.id, _r, data => setResources(data), error => console.log(error));
    }

    function onIncidentSelected(e) {
        const id = e.target.value;

        if (!id) {
            setResources([]);
            setIncident(null);
            return;
        }

        const _id = parseInt(id);
        setIncident(incidents.find(i => i.id === _id));
        console.log(incident);
        getResourcesInRadius(id, getMeters(document.getElementById('radius-input').value),
            data => setResources(data),
            error => console.log(error));
    }

    function getMiles(meters) {
        return meters * 0.000621371192;
    }

    function getMeters(miles) {
        return miles * 1609.344;
    }

    return (
        <div className='m-3'>
            <select className='form-select my-2' id='incident-select' onChange={onIncidentSelected}>
                <option value="">Select an incident...</option>
                {incidents ? incidents.map(incident => (<option key={incident.id} value={incident.id}>{incident.incident_name}</option>))
                    : "..."}
            </select>

            <label htmlFor="radius-input" className="form-label">Radius</label>
            <input type='number' className='form-control my-2' id='radius-input'
                onChange={onRadiusChanged}
                placeholder='0'>
            </input>

            <table className="table table-bordered">
                <thead className="table-dark">
                    <tr>
                        <th>Resource</th>
                        <th>Description</th>
                        <th>Distance (mi)</th>
                    </tr>
                </thead>
                <tbody id="resultTableBody">
                    {resources ? resources.map(e => (
                        <tr key={e.id}>
                            <td>
                                <img style={{ width: '16px', height: '16px' }}
                                    src={getIcon(e.icon)}></img>
                                {e.name}
                            </td>
                            <td>{e.description}</td>
                            <td>{Math.round(getMiles(e.distance) * 100) / 100}</td>
                        </tr>
                    )) : <></>}
                </tbody>
            </table>
        </div>
    );
}