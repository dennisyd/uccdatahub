import React, { useState } from 'react';

function DiscountCode({ onApplyDiscount, originalCost }) {
  const [code, setCode] = useState('');
  const [isApplied, setIsApplied] = useState(false);

  const handleApplyCode = () => {
    if (code.toUpperCase() === 'FREEUCC2024') {
      onApplyDiscount(0.01);
      setIsApplied(true);
    } else {
      alert('Invalid discount code');
      setIsApplied(false);
    }
  };

  return (
    <div className="discount-section">
      <div className="discount-input-group">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter discount code"
          className="discount-input"
          disabled={isApplied}
        />
        <button
          onClick={handleApplyCode}
          className="apply-discount-button"
          disabled={isApplied}
        >
          {isApplied ? 'Applied' : 'Apply'}
        </button>
      </div>
      {isApplied && (
        <div className="discount-applied">
          <span>Discount applied! Original cost: ${originalCost}</span>
        </div>
      )}
    </div>
  );
}

export default DiscountCode;