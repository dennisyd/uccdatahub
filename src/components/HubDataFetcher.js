import { useState, useEffect, useCallback } from 'react';

export const useHubData = (selectedStates, dataType, selectedParties, role, uccType) => {
  const [securedParties, setSecuredParties] = useState([]);
  const [recordCount, setRecordCount] = useState(0);
  const [cost, setCost] = useState(0);

  const fetchSecuredParties = useCallback(async () => {
    try {
      const stateValues = selectedStates
        .filter(state => state.value !== 'all')
        .map(state => state.value.toLowerCase());

      if (stateValues.length === 0) {
        setSecuredParties([{ value: 'all', label: 'All Secured Parties' }]);
        return;
      }

      const response = await fetch(`http://localhost:3001/api/secured-parties?states=${stateValues.join(',')}`);
      if (response.ok) {
        const parties = await response.json();
        const uniqueParties = [...new Set(parties.map(party => party['Secured Party Name']))].sort();
        setSecuredParties([
          { value: 'all', label: 'All Secured Parties' },
          ...uniqueParties.map(party => ({ value: party, label: party }))
        ]);
      } else {
        console.error('Failed to fetch secured parties');
        setSecuredParties([{ value: 'all', label: 'All Secured Parties' }]);
      }
    } catch (error) {
      console.error('Error fetching secured parties:', error);
      setSecuredParties([{ value: 'all', label: 'All Secured Parties' }]);
    }
  }, [selectedStates]);

  useEffect(() => {
    fetchSecuredParties();
  }, [fetchSecuredParties]);

  useEffect(() => {
    // Calculate record count and cost
    const newRecordCount = Math.floor(Math.random() * 10000) + 1000;
    setRecordCount(newRecordCount);
    setCost((newRecordCount * 0.05).toFixed(2));
  }, [dataType, selectedStates, selectedParties, role, uccType]);

  return { securedParties, recordCount, cost };
};