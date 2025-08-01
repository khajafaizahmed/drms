import React, { useState, useEffect, useMemo } from 'react';
import {
  MapContainer, TileLayer, Circle, Marker,
  useMapEvents,
  Polyline,
  Popup,
} from 'react-leaflet';
import './App.css';
import AddIncidentTypeForm from './Forms/AddIncidentTypeForm';
import AddResourceTypeForm from './Forms/AddResourceTypeForm';

import ResourceMarker from './components/ResourceMarker';
import IncidentMarker from './components/IncidentMarker';

import { ControlledMenu, Menu, MenuButton, MenuItem, SubMenu } from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';

import { locationToArray } from './utils';

function Map() {
  const [incidentTypes, setIncidentTypes] = useState(null);
  const [resourceTypes, setResourceTypes] = useState(null);

  const [data, setData] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(4);
  const [showIncidentForm, setShowIncidentForm] = useState(false); // State for incident type form visibility
  const [showResourceForm, setShowResourceForm] = useState(false); // State for resource type form visibility

  const [isMenuOpen, setMenuOpen] = useState(false);
  const [menuAnchorPoint, setMenuAnchorPoint] = useState({ x: 0, y: 0 });

  const [connectionInfo, setConnectionInfo] = useState({ type: null, id: null });

  useEffect(() => {
    fetch('http://localhost:2000/api/incident-types')
      .then(response => response.json())
      .then(json => setIncidentTypes(json))
      .catch(error => console.error(error));
  }, []);

  useEffect(() => {
    fetch('http://localhost:2000/api/resource-types')
      .then(response => response.json())
      .then(json => setResourceTypes(json))
      .catch(error => console.error(error));
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    fetch('http://localhost:2000/get-data')
      .then(response => response.json())
      .then(json => setData(prepareData(json)))
      .catch(error => console.error(error));
  }

  function makeLine(incident, resource) {
    if (!incident || !resource) return null;

    const key = incident.id + '_' + resource.id;

    return <Polyline key={key} pathOptions={{ color: 'lime' }} positions={[
      locationToArray(incident.location),
      locationToArray(resource.location),
    ]} >
      <Popup>
        <div className='card'>
          <div className='card-body'>
            <h6 className='card-title'>{incident.name} to {resource.name}</h6>
          </div>
          <div className='card-body'>
            <button onClick={() => handleDeleteConnection(incident.id, resource.id)}>Delete</button>
          </div>
        </div>
      </Popup>
    </Polyline>;
  }

  function prepareData(data) {
    const incidents = data.incidents.reduce((acc, incident) => {
      acc[incident.id] = incident;
      return acc;
    }, {});

    const resources = data.resources.reduce((acc, resource) => {
      acc[resource.id] = resource;
      return acc;
    }, {});

    const incident_resources = data.incident_resources.reduce((acc, ir) => {
      if (acc[ir.incident_id]) {
        acc[ir.incident_id].push(ir.resource_id);
      } else {
        acc[ir.incident_id] = [ir.resource_id];
      }
      return acc;
    }, {});

    const d = {
      incidents,
      resources,
      incident_resources,
    };

    console.log(d);

    return d;
  }

  function handleAddIncident(location, type, radius) {
    fetch('http://localhost:2000/add-incident', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location: {
          x: location.lng,
          y: location.lat
        },
        radius: radius,
        type: type
      })
    }).then(response => response.json())
      .then(json => {
        data.incidents[json[0].id] = json[0];
        let newData = {
          incidents: data.incidents,
          resources: data.resources,
          incident_resources: data.incident_resources
        };
        setData(newData);
      });
  }

  function handleAddResource(location, type, quantity) {
    fetch('http://localhost:2000/add-resource', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location: {
          x: location.lng,
          y: location.lat
        },
        quantity: quantity,
        type: type
      })
    }).then(response => response.json())
      .then(json => {
        data.resources[json[0].id] = json[0];
        let newData = {
          incidents: data.incidents,
          resources: data.resources,
          incident_resources: data.incident_resources
        };
        setData(newData);
      });
  }

  function handleDeleteResource(id) {
    fetch('http://localhost:2000/api/resources/' + id, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(response => loadData());
  }

  function handleDeleteIncident(id) {
    fetch('http://localhost:2000/api/incidents/' + id, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(response => loadData());
  }

  function handleAddConnection(incidentId, resourceId) {
    fetch('http://localhost:2000/api/connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        incident_id: incidentId,
        resource_id: resourceId,
      })
    }).then(response => response.json())
      .then(json => {
        if (data.incident_resources[incidentId]) {
          data.incident_resources[incidentId].push(resourceId);
        } else {
          data.incident_resources[incidentId] = [resourceId];
        }

        let newData = {
          incidents: data.incidents,
          resources: data.resources,
          incident_resources: data.incident_resources
        };
        setData(newData);
      });
  }

  function handleDeleteConnection(incidentId, resourceId) {
    fetch('http://localhost:2000/api/connection/' + incidentId + '/' + resourceId, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(response => loadData());
  }

  const handleAddIncidentType = (newIncidentType) => {
    console.log('New Incident Type Created:', newIncidentType);
    // TODO: Send new incident_type to database.
  };

  const handleAddResourceType = (newResourceType) => {
    console.log('New Resource Type Created:', newResourceType);
    // TODO: Send new resource_type to database.
  };

  function MapClickHandler() {
    const [position, setPosition] = useState(null)

    useMapEvents({
      click(e) {
        // Handle other click events if necessary
      },
      contextmenu(e) {
        // console.log(e);
        setPosition(e.latlng);
      }
    })

    return position === null ? null : (
      <Popup position={position}>
        <div className='d-flex flex-column gap-1'>
          {/* <button>Add Incident</button>
          <button>Add Resource</button> */}
          <Menu menuButton={<MenuButton>Add</MenuButton>} transition>
            <SubMenu label='Incident'>
              {
                incidentTypes.map(incidentType => (
                  <MenuItem key={incidentType.id} onClick={(e) => handleAddIncident(position, incidentType.id, 100000)}>
                    <img style={{ width: 16, height: 16 }} src={'http://localhost:5173/images/icons/' + incidentType.icon}></img>
                    {incidentType.name}
                  </MenuItem>
                ))
              }
            </SubMenu>
            <SubMenu label='Resource'>
              {
                resourceTypes.map(resourceType => (
                  <MenuItem key={resourceType.id} onClick={(e) => handleAddResource(position, resourceType.id, 1)}>
                    <img style={{ width: 16, height: 16 }} src={'http://localhost:5173/images/icons/' + resourceType.icon}></img>
                    {resourceType.name}
                  </MenuItem>
                ))
              }
            </SubMenu>
          </Menu>
        </div>
      </Popup>
    )
  }

  function handleConnect(type, data) {
    console.log(connectionInfo);
    console.log('connect', type, data);

    if (connectionInfo.type === 'incident' && type === 'resource') {
      console.log('connecting incident to resource');
      handleAddConnection(connectionInfo.id, data.id);
      setConnectionInfo({ type: null, id: null });
      return;
    }

    if (connectionInfo.type === 'resource' && type === 'incident') {
      console.log('connecting resource to incident');
      handleAddConnection(data.id, connectionInfo.id);
      setConnectionInfo({ type: null, id: null });
      return;
    }

    setConnectionInfo({ type: type, id: data.id });
    console.log('set');
    console.log(connectionInfo);

  }

  const displayMap = useMemo(
    () => (
      <MapContainer center={[39.1, -101.3]} zoom={zoomLevel} scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {data ? Object.values(data.incidents).map((incident) => (
          <IncidentMarker key={incident.id} incident={incident}
            onDeleteIncident={handleDeleteIncident}
            onConnect={handleConnect}></IncidentMarker>
        )) : "Loading"}

        {data ? Object.values(data.resources).map((resource) => (
          <ResourceMarker key={resource.id} resource={resource}
            onDeleteResource={handleDeleteResource}
            onConnect={handleConnect}></ResourceMarker>
        )) : "Loading"}

        {/* {data ? Object.entries(data.incident_resources).map(([incident_id, resource_ids]) => (
          makeLine(data.incidents[incident_id], data.resources[resource_id])
        )) : "Loading"} */}

        {data ? Object.entries(data.incident_resources).map(([incident_id, resource_ids]) => (
          resource_ids.map((resource_id) => (makeLine(data.incidents[incident_id], data.resources[resource_id])))
        )) : "Loading"}

        <MapClickHandler />
      </MapContainer>
    ),
    [data, connectionInfo],
  )

  // Some code below temporarily commented out as it clashes with the new forms.
  return (
    <>
        {displayMap}
      {/*       {showIncidentForm && ( */}
      {/*         <AddIncidentForm */}
      {/*           location={incidentLocation} */}
      {/*           onSubmit={(newIncident) => { */}
      {/*             setData(prevData => ({ */}
      {/*               ...prevData, */}
      {/*               incidents: [...prevData.incidents, newIncident] */}
      {/*             })); */}
      {/*             setShowIncidentForm(false); */}
      {/*           }} */}
      {/*           onCancel={() => setShowIncidentForm(false)} */}
      {/*         /> */}
      {/*       )} */}
      <button onClick={() => setShowIncidentForm(!showIncidentForm)}>
        {showIncidentForm ? 'Hide' : 'Add New Incident Type'}
      </button>
      {showIncidentForm && <AddIncidentTypeForm onAddIncidentType={handleAddIncidentType} />}

      <button onClick={() => setShowResourceForm(!showResourceForm)}>
        {showResourceForm ? 'Hide' : 'Add New Resource Type'}
      </button>
      {showResourceForm && <AddResourceTypeForm onAddResourceType={handleAddResourceType} />}
    </>
  )
}

export default Map;
