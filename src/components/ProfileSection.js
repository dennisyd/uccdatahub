import React, { useState, useEffect } from 'react';
import { motion as m } from 'framer-motion';
import { ChevronDown, User, Save, RefreshCw } from 'lucide-react';
import Button from './ui/Button';
import Select from 'react-select';

function ProfileSection({ 
  userId, dataType, selectedStates, selectedParties, role, uccType, 
  filingDateStart, filingDateEnd, totalRecords, cost, roles, uccTypes 
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(true);
  const [profileName, setProfileName] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/load-profiles?userId=${userId}`);
      if (response.ok) {
        const fetchedProfiles = await response.json();
        setProfiles(fetchedProfiles);
      } else {
        console.error('Failed to fetch profiles');
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
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
      uccType,
      filingDateStart,
      filingDateEnd,
      userId
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
        fetchProfiles(); // Refresh the profiles list
      } else {
        const errorData = await response.json();
        alert(`Failed to save profile: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('An error occurred while saving the profile.');
    }
  };

  const handleLoadProfile = () => {
    if (!selectedProfile) {
      alert('Please select a profile to load.');
      return;
    }

    const profile = profiles.find(p => p.name === selectedProfile.value);
    if (profile) {
      // Here you would typically update the parent component's state
      // For now, we'll just log the loaded profile
      console.log('Loaded profile:', profile);
      alert('Profile loaded successfully!');
    } else {
      alert('Failed to load profile. Profile not found.');
    }
  };

  return (
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
            <strong>Filing Date Range:</strong> 
            <span>
              {filingDateStart ? filingDateStart.toDateString() : 'Not set'} - 
              {filingDateEnd ? filingDateEnd.toDateString() : 'Not set'}
            </span>
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
        <Select
          options={profiles.map(p => ({ value: p.name, label: p.name }))}
          value={selectedProfile}
          onChange={setSelectedProfile}
          className="profile-select"
          placeholder="Select a profile..."
        />
        <Button onClick={handleLoadProfile} className="profile-button">
          <RefreshCw className="button-icon" />
          Load Profile
        </Button>
      </div>
    </div>
  );
}

export default ProfileSection;