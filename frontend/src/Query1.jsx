import { getIncidents, getIndicentResourceAnalysis } from './api';
import React, { useState, useEffect, useMemo } from 'react';


export default function Query1() {

    const [incidents, setIncidents] = useState([]);
    const [incident, setIncident] = useState(null);
    const [resources, setResources] = useState([]);

    useEffect(() => {
        getIncidents(data => setIncidents(data), error => console.log(error));
    }, []);

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
        getIndicentResourceAnalysis(id, 
            data => setResources(data.resources),
            error => console.log(error));
    }

    function getEntryRowClass(entry) {
        if (!entry.required) {
            return 'table-secondary';
        }
        else if (entry.satisfied) {
            return 'table-success';
        } else {
            return 'table-danger';
        }
    }

    function getIncidentStatus() {
        const s = resources.every(r => r.satisfied);

        return (
            <>
                <p className={s ? 'text-success' : 'text-danger'}>Status: {s? 'All resources satisfied' : 'Not all resources satisfied'}</p>
            </>
        );
    }

    return (
        <div className='m-3'>
            <select className='form-select my-2' id='incident-select' onChange={onIncidentSelected}>
                <option value="">Select an incident...</option>
                {incidents ? incidents.map(incident => (<option key={incident.id} value={incident.id}>{incident.incident_name}</option>))
                    : "..."}
            </select>

            <h5>{incident ? incident.incident_name : ''}</h5>

            <table className="table table-bordered">
                <thead className="table-dark">
                    <tr>
                        <th>Resource Type</th>
                        <th>Required</th>
                        <th>Needed</th>
                        <th>Provided</th>
                        <th>Satisfied</th>
                    </tr>
                </thead>
                <tbody id="resultTableBody">
                    {resources ? resources.map(resource => (
                        <tr key={resource.resource_type} className={getEntryRowClass(resource)}>
                            <td>{resource.name}</td>
                            <td>{resource.required? 'Yes' : 'No'}</td>
                            <td>{resource.quantity_needed}</td>
                            <td>{resource.quantity_provided}</td>
                            <td>{resource.satisfied? 'Yes' : 'No'}</td>
                        </tr>
                    )) : "..."}
                </tbody>
            </table>

            {incident ? getIncidentStatus() : ''}
        </div>
    );
}