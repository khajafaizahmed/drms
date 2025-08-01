import React, { useState, useEffect, useMemo } from 'react';
import {
    MapContainer, TileLayer, Circle, Marker,
    useMapEvents,
    Polyline,
    Popup,
} from 'react-leaflet';

import {createIcon} from '../utils';

export default function ResourceMarker({ resource, onDeleteResource, onConnect }) {
    return (
        <Marker position={[resource.location.y, resource.location.x]}
            icon={createIcon('http://localhost:5173/images/icons/' + resource.icon)}
            onClick={(e) => console.log(e)}
            draggable={false}>
            <Popup>
                <div className='card'>
                    <div className='card-body'>
                        <h6 className='card-title'>{resource.name} [{resource.id}] ({resource.quantity})</h6>
                        <p className='card-text'>{resource.description}</p>
                    </div>
                    <div className='card-body'>
                        <button onClick={() => onDeleteResource(resource.id)}>Delete</button>
                        <button onClick={() => onConnect('resource', resource)}>Connect this to...</button>
                    </div>
                </div>
            </Popup>
        </Marker>
    );
}