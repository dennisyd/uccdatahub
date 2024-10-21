import React from 'react';

function Button({ children, className, onClick }) {
  return (
    <button className={`btn ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}

export default Button;
