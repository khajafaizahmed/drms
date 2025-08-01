import { getIncidents, getEntityConnectionNum } from './api';
import React, { useState, useEffect, useMemo } from 'react';

import { getIcon } from './utils';

export default function Query2() {

    const [entities, setEntities] = useState([]);

    useEffect(() => {
        getEntityConnectionNum(0, data => setEntities(data), error => console.log(error));
    }, []);

    function onMinConnectionNumChanged(e) {
        var num = e.target.value;

        if (!num) {
            num = '0';
        }

        const _num = parseInt(num);

        getEntityConnectionNum(_num, data => setEntities(data), error => console.log(error));
    }

    return (
        <div className='m-3'>
            <label htmlFor="min-num-input" className="form-label">Min Connection Number</label>
            <input type='number' className='form-control my-2' id='min-num-input'
                onChange={onMinConnectionNumChanged}
                placeholder='0'>
            </input>

            <table className="table table-bordered">
                <thead className="table-dark">
                    <tr>
                        <th>Type</th>
                        <th>Name</th>
                        <th>Number of Connections</th>
                    </tr>
                </thead>
                <tbody id="resultTableBody">
                    {entities ? entities.map(e => (
                        <tr key={e.id}>
                            <td>{e.id.startsWith('i') ? 'Incident' : 'Resource'}</td>
                            <td>
                                <img style={{ width: '16px', height: '16px' }}
                                    src={getIcon(e.icon)}></img>
                                {e.name}
                            </td>
                            <td>{e.ConnectionNum}</td>
                        </tr>
                    )) : "..."}
                </tbody>
            </table>
        </div>
    );
}