import React from 'react';

function Select({ value, onValueChange, options }) {
  return (
    <select value={value} onChange={(e) => onValueChange(e.target.value)} className="form-select">
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export default Select;
