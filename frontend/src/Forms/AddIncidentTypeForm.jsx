// Cody Dukes

import React, { useState } from 'react';

const AddIncidentTypeForm = ({ onAddIncidentType }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#ffffff'); // Default color

  const handleSubmit = (e) => {
    e.preventDefault();
    // Call the parent function with the new incident type details
    onAddIncidentType({ name, color });
    // Clear the form fields after submission
    setName('');
    setColor('#ffffff');
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="incident-name">Incident Name: </label>
        <input
          type="text"
          id="incident-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="incident-color">Color: </label>
        <input
          type="color"
          id="incident-color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </div>
      <button type="submit">Add Incident Type</button>
    </form>
  );
};

export default AddIncidentTypeForm;
