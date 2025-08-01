import { getIncidents, getIncidentsByDate } from './api';
import React, { useState, useEffect, useMemo } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import 'react-datepicker/dist/react-datepicker-cssmodules.css';
import './App.css';

import { getIcon } from './utils';

export default function Query4() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [entities, setEntities] = useState([]);

    useEffect(() => {
        loadData(new Date());
    }, []);

    function onStartChanged(date) {
        loadData(date);
        
        setSelectedDate(date);
    }



    function loadData(date) {
        getIncidentsByDate(date, date, data => setEntities(data), error => console.log(error));
    }

    function formatDate(date) {
        if (!date)
            return '';
        return date.slice(0, 10);
    }

    return (
        <div className='m-3'>


            <div className='d-flex flex-column'>
                <div>
                    <label htmlFor="start-input" className="form-label">Date</label>
                    <DatePicker id="start-input" className='date-picker' selected={selectedDate} onChange={(date) => onStartChanged(date)} />

                </div>

            </div>


            <table className="table table-bordered">
                <thead className="table-dark">
                    <tr>
                        <th>Incident</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                    </tr>
                </thead>
                <tbody id="resultTableBody">
                    {entities ? entities.map(e => (
                        <tr key={e.id}>
                            <td>
                                <img style={{ width: '16px', height: '16px' }}
                                    src={getIcon(e.icon)}></img>
                                {e.type}
                            </td>
                            <td>{formatDate(e.start_date)}</td>
                            <td>{formatDate(e.end_date)}</td>
                        </tr>
                    )) : "..."}
                </tbody>
            </table>
        </div>
    );
}