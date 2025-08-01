// Cody Dukes

import React, { useState } from 'react';

const AddResourceTypeForm = ({ onAddResourceType }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#ffffff'); // Default color value
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) {
      alert("Name is required!");
      return;
    }

    const newResourceType = {
      name,
      color,
      description: description || '' // Make description optional
    };

    // Call the function passed via props to handle adding the resource type
    onAddResourceType(newResourceType);

    // Reset the form
    setName('');
    setColor('#ffffff'); // Reset to default color
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Name: </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Color: </label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </div>
      <div>
        <label>Description: </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <button type="submit">Add Resource Type</button>
    </form>
  );
};

export default AddResourceTypeForm;
