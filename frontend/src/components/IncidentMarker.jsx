import React, { useState, useEffect, useMemo } from 'react';
import {
    MapContainer, TileLayer, Circle, Marker,
    useMapEvents,
    Polyline,
    Popup,
} from 'react-leaflet';

import { createIcon, getIcon } from '../utils';

import { getIndicentResourceAnalysis } from '../api';

export default function IncidentMarker({ incident, onDeleteIncident, onConnect }) {
    const [resourceDetails, setResourceDetails] = useState(null);

    const handlePopupOpen = () => {
        // fetch(`http://localhost:2000/api/incident-resource-analysis/${incident.id}`)
        //     .then(response => response.json())
        //     .then(json => setResourceDetails(json))
        //     .catch(error => console.error(error));
        getIndicentResourceAnalysis(incident.id, 
            data => setResourceDetails(data),
            error => console.error(error));
    };

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

    function resourceTable() {
        return (
            <table className="table">
                <thead>
                    <tr>
                        <th></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {resourceDetails.resources.map(entry => (
                        <tr className={getEntryRowClass(entry)} key={entry.resource_type}>
                            <td>
                                <img style={{ width: 16, height: 16 }}
                                    src={getIcon(entry.icon)}
                                    alt={entry.name}></img>
                            </td>
                            <td>{entry.quantity_provided}/{entry.quantity_needed}</td>
                        </tr>
                    ))}
                </tbody>
            </table>);
    }

    return (
        <Circle
            center={[incident.location.y, incident.location.x]}
            radius={incident.radius}
            color={incident.color}
        >
            <Marker key={incident.id} position={[incident.location.y, incident.location.x]}
                icon={createIcon('http://localhost:5173/images/icons/' + incident.icon)}
                draggable={false} >
                <Popup eventHandlers={{
                    add: handlePopupOpen,
                }}>
                    <div className='card'>
                        <div className='card-body'>
                            <h6 className='card-title'>{incident.name} [{incident.id}]</h6>
                            <p className='card-text'>{incident.description}</p>
                        </div>
                        <div className='card-body'>
                            {resourceDetails ? resourceTable() : "..."}
                        </div>
                        <div className='card-body'>
                            <button onClick={() => onDeleteIncident(incident.id)}>Delete</button>
                            <button onClick={() => onConnect('incident', incident)}>Connect this to...</button>
                        </div>
                    </div>
                </Popup>
            </Marker>
        </Circle>
    );
}