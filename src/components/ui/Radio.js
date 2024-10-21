import React from 'react';

function Radio({ id, label, checked, onChange }) {
  return (
    <div>
      <input
        type="radio"
        id={id}
        checked={checked}
        onChange={onChange}
        className="form-radio"
      />
      <label htmlFor={id} className="ml-2">{label}</label>
    </div>
  );
}

export default Radio;
