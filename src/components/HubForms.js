import React from 'react';
import { Database, MapPin, Building } from 'lucide-react';
import Radio from './ui/Radio';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import { states, roles, uccTypes } from '../constants/formOptions';
import 'react-datepicker/dist/react-datepicker.css';

function HubForms({
  dataType,
  setDataType,
  selectedStates,
  setSelectedStates,
  selectedParties,
  setSelectedParties,
  securedParties,
  role,
  setRole,
  uccType,
  setUccType,
  filingDateStart,
  setFilingDateStart,
  filingDateEnd,
  setFilingDateEnd
}) {
  const handleDataTypeChange = (newDataType) => {
    setDataType(newDataType);
    if (newDataType === 'basic') {
      setRole('all');
    }
  };

  const handleStateChange = (selectedOptions) => {
    if (!selectedOptions) {
      setSelectedStates([]);
      setSelectedParties([]);
      return;
    }

    setSelectedStates([selectedOptions]);
    setSelectedParties([]);
  };

  const handlePartyChange = (selectedOptions) => {
    if (!selectedOptions || selectedOptions.length === 0) {
      setSelectedParties([]);
      return;
    }

    if (selectedOptions.some((option) => option.value === 'all')) {
      setSelectedParties([securedParties[0]]);
    } else {
      setSelectedParties(selectedOptions);
    }
  };

  return (
    <div className="hub-layout">
      {/* Data Type Section */}
      <div className="hub-section">
        <h3 className="section-title">
          <Database className="section-icon" /> Data Type
        </h3>
        <div className="radio-group">
          <Radio
            id="basic"
            label="Standard"
            checked={dataType === 'basic'}
            onChange={() => handleDataTypeChange('basic')}
          />
          <Radio
            id="full"
            label="Comprehensive"
            checked={dataType === 'full'}
            onChange={() => handleDataTypeChange('full')}
          />
        </div>
      </div>

      {/* Select States Section */}
      <div className="hub-section">
        <h3 className="section-title">
          <MapPin className="section-icon" /> Select States
        </h3>
        <Select
          options={states}
          value={selectedStates[0]}
          onChange={handleStateChange}
          className="react-select-container"
          classNamePrefix="react-select"
          placeholder="Select states..."
          isOptionDisabled={(option) =>
            selectedStates.some((state) => state.value === 'all') && option.value !== 'all'
          }
          closeMenuOnSelect={false}
        />
      </div>

      {/* Secured Parties Section */}
      <div className="hub-section">
        <h3 className="section-title">
          <Building className="section-icon" /> Secured Parties
        </h3>
        <Select
          isMulti
          options={securedParties}
          value={selectedParties}
          onChange={handlePartyChange}
          className="react-select-container"
          classNamePrefix="react-select"
          placeholder="Select secured parties..."
          isOptionDisabled={(option) =>
            selectedParties.some((party) => party.value === 'all') && option.value !== 'all'
          }
          closeMenuOnSelect={false}
        />
      </div>

      {/* Role Section */}
      <div className="hub-section">
        <h3 className="section-title">Role</h3>
        <Select
          options={roles}
          value={roles.find((r) => r.value === role)}
          onChange={(selectedOption) => setRole(selectedOption.value)}
          className="react-select-container"
          classNamePrefix="react-select"
          isDisabled={dataType === 'basic'}
        />
      </div>

      {/* UCC Type Section */}
      <div className="hub-section">
        <h3 className="section-title">UCC Type</h3>
        <Select
          options={uccTypes}
          value={uccTypes.find((t) => t.value === uccType)}
          onChange={(selectedOption) => setUccType(selectedOption.value)}
          className="react-select-container"
          classNamePrefix="react-select"
        />
      </div>

      {/* Filing Date Range Section */}
      <div className="hub-section">
        <h3 className="section-title">Filing Date Range</h3>
        <div className="date-picker-container">
          <DatePicker
            selected={filingDateStart}
            onChange={(date) => setFilingDateStart(date)}
            selectsStart
            startDate={filingDateStart}
            endDate={filingDateEnd}
            placeholderText="Start Date"
          />
          <DatePicker
            selected={filingDateEnd}
            onChange={(date) => setFilingDateEnd(date)}
            selectsEnd
            startDate={filingDateStart}
            endDate={filingDateEnd}
            minDate={filingDateStart}
            placeholderText="End Date"
          />
        </div>
      </div>
    </div>
  );
}

export default HubForms;