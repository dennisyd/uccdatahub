export const saveProfile = async (profileData) => {
    try {
      const response = await fetch('http://localhost:3001/api/save-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
  
      if (response.ok) {
        alert('Profile saved successfully!');
      } else {
        alert('Failed to save profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('An error occurred while saving the profile.');
    }
  };
  
  export const loadProfile = async (profileName) => {
    try {
      const response = await fetch(`http://localhost:3001/api/load-profile?name=${profileName}`);
      if (response.ok) {
        const profile = await response.json();
        return profile;
      } else {
        alert('Failed to load profile. Please check the profile name and try again.');
        return null;
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      alert('An error occurred while loading the profile.');
      return null;
    }
  };
  
  export const generateCSV = (selectedStates, recordCount, cost) => {
    const csvContent = selectedStates
      .filter(state => state.value !== 'all')
      .map(state => `${state.label},${recordCount},${cost}`)
      .join('\n');
  
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'ucc_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };