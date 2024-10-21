// File: src/utils/uccQueryUtils.js

export function generateUCCQuery(params) {
    const {
      dataType,
      selectedStates,
      selectedParties,
      uccType,
      role
    } = params;
  
    if (selectedStates.length === 0) {
      return ''; // Return empty string if no state is selected
    }
  
    const state = selectedStates[0].value.toLowerCase(); // We'll use only the first selected state
    const tableName = `${state}${dataType === 'full' ? '2' : ''}`;
  
    let query = `SELECT * FROM ${tableName}`;
    let whereConditions = [];
  
    // Secured parties filter
    if (selectedParties.length > 0 && !selectedParties.some(party => party.value === 'all')) {
      const partyList = selectedParties.map(party => `'${party.value}'`).join(', ');
      whereConditions.push(`\`Secured Party Name\` IN (${partyList})`);
    }
  
    // UCC Type filter
    if (uccType === 'uccFiling') {
      whereConditions.push(`\`Filing Type\` IN ('UCC-1', 'Initial')`);
    }
  
    // Role filter (only for comprehensive data type)
    if (dataType === 'full' && role === 'owner') {
      whereConditions.push(`(\`Official Designation\` LIKE '%Owner%' OR \`Official Designation\` LIKE '%Founder%')`);
    }
  
    // Combine WHERE conditions
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }
  
    return query;
  }