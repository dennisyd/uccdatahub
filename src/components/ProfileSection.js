import React, { useState, useEffect } from 'react';
import { motion as m } from 'framer-motion';
import { ChevronDown, User, Save, RefreshCw } from 'lucide-react';
import Button from './ui/Button';
import Select from 'react-select';

function ProfileSection({ 
  userId, 
  dataType, 
  selectedStates, 
  selectedParties, 
  role, 
  uccType, 
  filingDateStart, 
  filingDateEnd, 
  totalRecords, 
  cost, 
  roles, 
  uccTypes,
  onLoadProfile // Added this prop
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(true);
  const [profileName, setProfileName] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, [userId]);

  const fetchProfiles = async () => {
    if (!userId) return;
    
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

    setIsLoading(true);
    try {
      const profile = {
        name: profileName,
        dataType,
        selectedStates,
        selectedParties,
        role,
        uccType,
        filingDateStart: filingDateStart ? filingDateStart.toISOString() : null,
        filingDateEnd: filingDateEnd ? filingDateEnd.toISOString() : null,
        userId
      };

      const response = await fetch('http://localhost:3001/api/save-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        alert('Profile saved successfully!');
        setProfileName('');
        await fetchProfiles(); // Refresh the profiles list
      } else {
        const errorData = await response.json();
        alert(`Failed to save profile: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('An error occurred while saving the profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadProfile = () => {
    if (!selectedProfile) {
      alert('Please select a profile to load.');
      return;
    }

    if (!onLoadProfile) {
      console.error('onLoadProfile prop is not defined');
      alert('Unable to load profile due to a configuration error.');
      return;
    }

    const profile = profiles.find(p => p.name === selectedProfile.value);
    if (profile && profile.config) {
      try {
        // Prepare the config object
        const configToLoad = {
          dataType: profile.config.dataType || 'basic',
          selectedStates: profile.config.selectedStates || [],
          selectedParties: profile.config.selectedParties || [],
          role: profile.config.role || 'all',
          uccType: profile.config.uccType || 'contactInfo',
          filingDateStart: profile.config.filingDateStart ? new Date(profile.config.filingDateStart) : null,
          filingDateEnd: profile.config.filingDateEnd ? new Date(profile.config.filingDateEnd) : null
        };
        
        onLoadProfile(configToLoad);
        setSelectedProfile(null);
        alert('Profile loaded successfully!');
      } catch (error) {
        console.error('Error loading profile:', error);
        alert('Failed to load profile. Invalid profile data.');
      }
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

        <div className="profile-actions" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Enter profile name"
              className="profile-name-input"
              style={{ flex: 1 }}
            />
            <Button 
              onClick={handleSaveProfile} 
              className="profile-button"
              disabled={isLoading}
            >
              <Save className="button-icon" />
              {isLoading ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Select
              options={profiles.map(p => ({ value: p.name, label: p.name }))}
              value={selectedProfile}
              onChange={setSelectedProfile}
              className="profile-select"
              placeholder="Select a profile..."
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '38px',
                  marginBottom: '0.5rem'
                }),
                menu: (base) => ({
                  ...base,
                  zIndex: 9999
                })
              }}
              isClearable
            />
            <Button 
              onClick={handleLoadProfile} 
              className="profile-button"
              disabled={!selectedProfile}
            >
              <RefreshCw className="button-icon" />
              Load Profile
            </Button>
          </div>
        </div>
      </m.div>

      <style jsx>{`
        .profile-section {
          margin-top: 2rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .profile-header {
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          border-bottom: 1px solid #eee;
        }

        .profile-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
          font-size: 1.1rem;
        }

        .section-icon {
          width: 1.2rem;
          height: 1.2rem;
        }

        .profile-icon {
          transition: transform 0.3s ease;
        }

        .profile-icon.rotate {
          transform: rotate(180deg);
        }

        .profile-content {
          overflow: hidden;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          padding: 1rem;
        }

        .profile-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .profile-name-input {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        .profile-name-input:focus {
          outline: none;
          border-color: #4a90e2;
        }

        .button-icon {
          width: 1.2rem;
          height: 1.2rem;
        }

        .profile-button {
          white-space: nowrap;
          min-width: 120px;
        }

        .profile-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .profile-select {
          width: 100%;
        }
      `}</style>
    </div>
  );
}

export default ProfileSection;