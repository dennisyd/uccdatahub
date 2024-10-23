import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as m } from 'framer-motion';
import { Database, MapPin, Building, Download, DollarSign } from 'lucide-react';
import Button from './ui/Button';
import Radio from './ui/Radio';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import ProfileSection from './ProfileSection';
import 'react-datepicker/dist/react-datepicker.css';
import './Hub.css';

function Hub() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [dataType, setDataType] = useState('basic');
  const [selectedStates, setSelectedStates] = useState([]);
  const [selectedParties, setSelectedParties] = useState([]);
  const [securedParties, setSecuredParties] = useState([]);
  const [role, setRole] = useState('all');
  const [uccType, setUccType] = useState('contactInfo');
  const [totalRecords, setTotalRecords] = useState(0);
  const [cost, setCost] = useState(0);
  const [filingDateStart, setFilingDateStart] = useState(null);
  const [filingDateEnd, setFilingDateEnd] = useState(null);

  const states = [
    { value: 'all', label: 'All States' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'CA', label: 'California' },
    // ... (add all other states here)
  ];

  const roles = [
    { value: 'owner', label: 'Owner Only' },
    { value: 'all', label: 'All' },
  ];

  const uccTypes = [
    { value: 'uccFiling', label: 'UCC-1 or Initial' },
    { value: 'all', label: 'All UCC Filings' },
  ];

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      navigate('/login');
    } else {
      setUserId(storedUserId);
    }
  }, [navigate]);

  useEffect(() => {
    fetchSecuredParties();
  }, [selectedStates]);

  const fetchSecuredParties = async () => {
    try {
      const stateParams = selectedStates.map(state => state.value).join(',');
      const response = await fetch(`http://localhost:3001/api/secured-parties?states=${stateParams}`);
      if (response.ok) {
        const parties = await response.json();
        setSecuredParties(parties);
      } else {
        console.error('Failed to fetch secured parties');
      }
    } catch (error) {
      console.error('Error fetching secured parties:', error);
    }
  };

  const handleDataTypeChange = (newDataType) => {
    setDataType(newDataType);
    if (newDataType === 'basic') {
      setRole('all');
    }
  };

  const handleStateChange = (selectedOptions) => {
    if (selectedOptions.some(option => option.value === 'all')) {
      setSelectedStates([states[0]]);
    } else {
      setSelectedStates(selectedOptions);
    }
    setSelectedParties([]);  // Clear selected parties when states change
  };

  const handlePartyChange = (selectedOptions) => {
    if (selectedOptions.some(option => option.value === 'all')) {
      setSelectedParties([securedParties[0]]);
    } else {
      setSelectedParties(selectedOptions);
    }
  };

  const handleProfileLoad = (config) => {
    console.log('Loading profile config:', config); // Debug log

    try {
      setDataType(config.dataType || 'basic');
      setSelectedStates(config.selectedStates || []);
      setSelectedParties(config.selectedParties || []);
      setRole(config.role || 'all');
      setUccType(config.uccType || 'contactInfo');
      setFilingDateStart(config.filingDateStart ? new Date(config.filingDateStart) : null);
      setFilingDateEnd(config.filingDateEnd ? new Date(config.filingDateEnd) : null);
    } catch (error) {
      console.error('Error applying profile:', error);
      alert('Error loading profile settings');
    }
  };

  // And ensure the ProfileSection component is rendered with all props:
  <ProfileSection
    userId={userId}
    dataType={dataType}
    selectedStates={selectedStates}
    selectedParties={selectedParties}
    role={role}
    uccType={uccType}
    filingDateStart={filingDateStart}
    filingDateEnd={filingDateEnd}
    totalRecords={totalRecords}
    cost={cost}
    roles={roles}
    uccTypes={uccTypes}
    onLoadProfile={handleProfileLoad}  // Make sure this line is present
  />

  const handleGenerateCSV = async () => {
    try {
      // Format states and parties properly
      const formattedStates = selectedStates
        .filter(state => state.value !== 'all')
        .map(state => state.value.toLowerCase());

      const formattedParties = selectedParties
        .filter(party => party.value !== 'all')
        .map(party => party.value);

      // Log the data being sent
      console.log('Sending data:', {
        states: formattedStates,
        dataType,
        selectedParties: formattedParties,
        uccType,
        role,
        filingDateStart: filingDateStart ? filingDateStart.toISOString().split('T')[0] : null,
        filingDateEnd: filingDateEnd ? filingDateEnd.toISOString().split('T')[0] : null
      });

      const response = await fetch('http://localhost:3001/api/generate-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          states: formattedStates,
          dataType,
          selectedParties: formattedParties,
          uccType,
          role,
          filingDateStart: filingDateStart ? filingDateStart.toISOString().split('T')[0] : null,
          filingDateEnd: filingDateEnd ? filingDateEnd.toISOString().split('T')[0] : null
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Server responded with status ${response.status}`);
      }

      const data = await response.json();

      if (!data.csv) {
        throw new Error('No CSV data received from server');
      }

      // Create and download the CSV file
      const blob = new Blob([data.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'ucc_data.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      // Update total records and cost
      const newTotalRecords = totalRecords + data.recordCount;
      setTotalRecords(newTotalRecords);
      setCost((newTotalRecords * 0.05).toFixed(2));

      alert(`CSV generated successfully. Added ${data.recordCount} records. Total records: ${newTotalRecords}`);

      // Reset everything
      setDataType('basic');
      setSelectedStates([]);
      setSelectedParties([]);
      setRole('all');
      setUccType('contactInfo');
      setFilingDateStart(null);
      setFilingDateEnd(null);
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('An error occurred while generating the CSV: ' + error.message);
    }
  };

  return (
    <div className="hub-container">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="hub-content"
      >
        <h2 className="hub-title">UCC Data Hub</h2>

        <div className="hub-layout">
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

          <div className="hub-section">
            <h3 className="section-title">
              <MapPin className="section-icon" /> Select States
            </h3>
            <Select
              isMulti
              options={states}
              value={selectedStates}
              onChange={handleStateChange}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Select states..."
              isOptionDisabled={(option) =>
                selectedStates.some(state => state.value === 'all') && option.value !== 'all'
              }
              closeMenuOnSelect={false}
            />
          </div>

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
                selectedParties.some(party => party.value === 'all') && option.value !== 'all'
              }
              closeMenuOnSelect={false}
            />
          </div>

          <div className="hub-section">
            <h3 className="section-title">Role</h3>
            <Select
              options={roles}
              value={roles.find(r => r.value === role)}
              onChange={(selectedOption) => setRole(selectedOption.value)}
              className="react-select-container"
              classNamePrefix="react-select"
              isDisabled={dataType === 'basic'}
            />
          </div>

          <div className="hub-section">
            <h3 className="section-title">UCC Type</h3>
            <Select
              options={uccTypes}
              value={uccTypes.find(t => t.value === uccType)}
              onChange={(selectedOption) => setUccType(selectedOption.value)}
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>

          <div className="hub-section">
            <h3 className="section-title">Filing Date Range</h3>
            <div className="date-picker-container">
              <DatePicker
                selected={filingDateStart}
                onChange={date => setFilingDateStart(date)}
                selectsStart
                startDate={filingDateStart}
                endDate={filingDateEnd}
                placeholderText="Start Date"
              />
              <DatePicker
                selected={filingDateEnd}
                onChange={date => setFilingDateEnd(date)}
                selectsEnd
                startDate={filingDateStart}
                endDate={filingDateEnd}
                minDate={filingDateStart}
                placeholderText="End Date"
              />
            </div>
          </div>
        </div>

        <ProfileSection
          userId={userId}
          dataType={dataType}
          selectedStates={selectedStates}
          selectedParties={selectedParties}
          role={role}
          uccType={uccType}
          filingDateStart={filingDateStart}
          filingDateEnd={filingDateEnd}
          totalRecords={totalRecords}
          cost={cost}
          roles={roles}
          uccTypes={uccTypes}
          onLoadProfile={handleProfileLoad}
        />

        <div className="action-buttons">
          <Button
            className="generate-csv-button"
            onClick={handleGenerateCSV}
          >
            <Download className="button-icon" />
            Generate CSV
          </Button>
          <Button
            className="payment-button"
            onClick={() => console.log('Processing payment...')}
          >
            <DollarSign className="button-icon" />
            Process Payment (${cost})
          </Button>
        </div>
      </m.div>
    </div>
  );
}

export default Hub;