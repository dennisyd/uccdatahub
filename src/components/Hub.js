import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as m } from 'framer-motion';
import HubForms from './HubForms';
import HubActions from './HubActions';
import ProfileSection from './ProfileSection';
import { states, roles, uccTypes } from '../constants/formOptions';
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
  const [discountedCost, setDiscountedCost] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [hasGeneratedCsv, setHasGeneratedCsv] = useState(false);
  const [csvData, setCsvData] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      navigate('/login');
    } else {
      setUserId(storedUserId);
    }
  }, [navigate]);

  useEffect(() => {
    if (selectedStates.length > 0) {
      fetchSecuredParties();
    }
  }, [selectedStates]);

  const fetchSecuredParties = async () => {
    try {
      const validStates = selectedStates
        .filter((state) => state.value !== 'all')
        .map((state) => state.value);

      if (validStates.length === 0) {
        setSecuredParties([{ value: 'all', label: 'All Secured Parties' }]);
        return;
      }

      const stateParams = validStates.join(',');
      const response = await fetch(`http://localhost:3001/api/secured-parties?states=${stateParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const parties = await response.json();
      setSecuredParties(parties);
    } catch (error) {
      console.error('Error fetching secured parties:', error);
      setSecuredParties([{ value: 'all', label: 'All Secured Parties' }]);
    }
  };

  const handleProfileLoad = (config) => {
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

  return (
    <div className="hub-container">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="hub-content"
      >
        <h2 className="hub-title">UCC Data Hub</h2>

        <HubForms
          dataType={dataType}
          setDataType={setDataType}
          selectedStates={selectedStates}
          setSelectedStates={setSelectedStates}
          selectedParties={selectedParties}
          setSelectedParties={setSelectedParties}
          securedParties={securedParties}
          role={role}
          setRole={setRole}
          uccType={uccType}
          setUccType={setUccType}
          filingDateStart={filingDateStart}
          setFilingDateStart={setFilingDateStart}
          filingDateEnd={filingDateEnd}
          setFilingDateEnd={setFilingDateEnd}
          roles={roles}
          uccTypes={uccTypes}
          states={states}
        />

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

        <HubActions
          selectedStates={selectedStates}
          selectedParties={selectedParties}
          dataType={dataType}
          role={role}
          uccType={uccType}
          filingDateStart={filingDateStart}
          filingDateEnd={filingDateEnd}
          hasGeneratedCsv={hasGeneratedCsv}
          setHasGeneratedCsv={setHasGeneratedCsv}
          csvData={csvData}
          setCsvData={setCsvData}
          totalRecords={totalRecords}
          setTotalRecords={setTotalRecords}
          cost={cost}
          setCost={setCost}
          discountedCost={discountedCost}
          setDiscountedCost={setDiscountedCost}
          isPaying={isPaying}
          setIsPaying={setIsPaying}
          setDataType={setDataType}
          setSelectedStates={setSelectedStates}
          setSelectedParties={setSelectedParties}
          setRole={setRole}
          setUccType={setUccType}
          setFilingDateStart={setFilingDateStart}
          setFilingDateEnd={setFilingDateEnd}
          roles={roles}
          uccTypes={uccTypes}
          states={states}
          securedParties={securedParties}
        />
      </m.div>
    </div>
  );
}

export default Hub;