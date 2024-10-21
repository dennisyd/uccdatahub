// File: src/utils/uccQueryUtils.js

export function generateUCCQuery(params) {
  const {
    dataType,
    selectedParties,
    uccType,
    role
  } = params;

  const tableName = `{state}`; // Use placeholder
  const table2Name = `{state}2`; // Use placeholder

  let query = '';
  let whereConditions = [];

  if (dataType === 'full') {
    query = `SELECT * FROM ${tableName} 
             LEFT JOIN ${table2Name} ON ${tableName}.\`Filing Number\` = ${table2Name}.\`Filing Number\``;
  } else {
    query = `SELECT * FROM ${tableName}`;
  }

  // Secured parties filter
  if (selectedParties.length > 0 && !selectedParties.some(party => party.value === 'all')) {
    const partyList = selectedParties.map(party => `'${party.value}'`).join(', ');
    whereConditions.push(`${tableName}.\`Secured Party Name\` IN (${partyList})`);
  }

  // UCC Type filter
  if (uccType === 'uccFiling') {
    whereConditions.push(`${tableName}.\`Filing Type\` IN ('UCC-1', 'Initial')`);
  }

  // Role filter (only for comprehensive data type)
  if (dataType === 'full' && role === 'owner') {
    whereConditions.push(`(${table2Name}.\`Official Designation\` LIKE '%Owner%' OR ${table2Name}.\`Official Designation\` LIKE '%Founder%' OR ${table2Name}.\`Official Designation\` IS NULL)`);
  }

  // Combine WHERE conditions
  if (whereConditions.length > 0) {
    query += ' WHERE ' + whereConditions.join(' AND ');
  }

  return query;
}