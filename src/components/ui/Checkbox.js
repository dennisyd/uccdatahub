import React from 'react';

function Checkbox({ id, label, checked, onChange }) {
  return (
    <div>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="form-checkbox"
      />
      <label htmlFor={id} className="ml-2">{label}</label>
    </div>
  );
}

export default Checkbox;
