import React, { useState, useEffect } from 'react';
import { motion as m } from 'framer-motion';
import { ChevronDown, DollarSign, Database, MapPin, User, Building, Save, RefreshCw, Download } from 'lucide-react';
import Button from './ui/Button';
import Radio from './ui/Radio';
import Select from 'react-select';
import './Hub.css';

function Hub() {
  const [dataType, setDataType] = useState('basic');
  const [selectedStates, setSelectedStates] = useState([]);
  const [selectedParties, setSelectedParties] = useState([]);
  const [securedParties, setSecuredParties] = useState([]);
  const [isProfileOpen, setIsProfileOpen] = useState(true);
  const [role, setRole] = useState('all');
  const [uccType, setUccType] = useState('contactInfo');
  const [profileName, setProfileName] = useState('');
  const [totalRecords, setTotalRecords] = useState(0);
  const [cost, setCost] = useState(0);

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

  const handleSaveProfile = async () => {
    if (!profileName) {
      alert('Please enter a profile name before saving.');
      return;
    }

    const profile = {
      name: profileName,
      dataType,
      selectedStates,
      selectedParties,
      role,
      uccType
    };

    try {
      const response = await fetch('http://localhost:3001/api/save-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        alert('Profile saved successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to save profile: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('An error occurred while saving the profile.');
    }
  };

  const handleLoadProfile = async () => {
    if (!profileName) {
      alert('Please enter a profile name to load.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/load-profile?name=${encodeURIComponent(profileName)}`);
      if (response.ok) {
        const profile = await response.json();
        setDataType(profile.dataType);
        setSelectedStates(profile.selectedStates);
        setSelectedParties(profile.selectedParties);
        setRole(profile.role);
        setUccType(profile.uccType);
        alert('Profile loaded successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to load profile: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      alert(`An error occurred while loading the profile: ${error.message}`);
    }
  };

  const handleGenerateCSV = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/generate-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          states: selectedStates.map(state => state.value.toLowerCase()),
          dataType,
          selectedParties: selectedParties.map(party => party.value),
          uccType,
          role
        }),
      });

      if (response.ok) {
        const { csv, recordCount } = await response.json();
        
        // Create and download the CSV file
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'ucc_data.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);

        // Update total records and cost
        const newTotalRecords = totalRecords + recordCount;
        setTotalRecords(newTotalRecords);
        setCost((newTotalRecords * 0.05).toFixed(2));

        alert(`CSV generated successfully. Added ${recordCount} records. Total records: ${newTotalRecords}`);

        // Reset everything
        setDataType('basic');
        setSelectedStates([]);
        setSelectedParties([]);
        setRole('all');
        setUccType('contactInfo');
        setProfileName('');
      } else {
        throw new Error('Failed to generate CSV');
      }
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('An error occurred while generating the CSV. Please try again.');
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
        </div>

        <div className="profile-section">
          <div className="profile-header" onClick={() => setIsProfileOpen(!isProfileOpen)}>
            <h3 className="profile-title">
              <User className="section-icon" /> Your Profile
            </h3>
            <ChevronDown className={`profile-icon ${isProfileOpen ? 'rotate' : ''}`} />
          </div>
          <m.div 
            animate={{ height: isProfileOpen ? 'auto' : '0' }}
            className="profile-content"
          >
            <div className="profile-grid">
              <div className="profile-item">
                <strong>Data Type:</strong> 
                <span>{dataType === 'basic' ? 'Standard' : 'Comprehensive'}</span>
              </div>
              <div className="profile-item">
                <strong>Selected States:</strong> 
                <span>{selectedStates.map(state => state.label).join(', ') || 'None'}</span>
              </div>
              <div className="profile-item">
                <strong>Secured Parties:</strong> 
                <span>{selectedParties.map(party => party.label).join(', ') || 'None'}</span>
              </div>
              <div className="profile-item">
                <strong>Role:</strong> 
                <span>{roles.find(r => r.value === role)?.label}</span>
              </div>
              <div className="profile-item">
                <strong>UCC Type:</strong> 
                <span>{uccTypes.find(t => t.value === uccType)?.label}</span>
              </div>
              <div className="profile-item">
                <strong>Total Records Downloaded:</strong> 
                <span>{totalRecords.toLocaleString()}</span>
              </div>
              <div className="profile-item">
                <strong>Estimated Cost:</strong> 
                <span>${cost}</span>
              </div>
            </div>
          </m.div>
        </div>

        <div className="profile-actions">
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Enter profile name"
            className="profile-name-input"
          />
          <Button onClick={handleSaveProfile} className="profile-button">
            <Save className="button-icon" />
            Save Profile
          </Button>
          <Button onClick={handleLoadProfile} className="profile-button">
            <RefreshCw className="button-icon" />
            Load Profile
          </Button>
        </div>

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