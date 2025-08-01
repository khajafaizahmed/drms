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

import { Route, Routes } from 'react-router';

import NavBar from './NavBar';
import Map from './Map';
import MainPage from './MainPage';
import Query1 from './Query1';
import Query2 from './Query2';
import Query3 from './Query3';
import Query4 from './Query4';


function App() {
  
  return (
    <div className='main-container'>
      <NavBar></NavBar>
      <Routes>
        <Route path='/' element={<MainPage />} />
        <Route path='map' element={<Map />} />
        <Route path='/query1' element={<Query1 />} />
        <Route path='/query2' element={<Query2 />} />
        <Route path='/query3' element={<Query3 />} />
        <Route path='/query4' element={<Query4 />} />
      </Routes>
    </div>
  )
}

export default App;
