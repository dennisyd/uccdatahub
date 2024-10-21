import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Select from 'react-select';
import { Upload, Save, Download } from 'lucide-react';
import './AdminPage.css';

const states = [
  { value: 'nc', label: 'North Carolina' },
  { value: 'al', label: 'Alabama' },
  { value: 'ak', label: 'Alaska' },
  { value: 'az', label: 'Arizona' },
  { value: 'ar', label: 'Arkansas' },
  { value: 'ca', label: 'California' },
  { value: 'co', label: 'Colorado' },
  { value: 'ct', label: 'Connecticut' },
  { value: 'de', label: 'Delaware' },
  { value: 'fl', label: 'Florida' },
  { value: 'ga', label: 'Georgia' },
  { value: 'hi', label: 'Hawaii' },
  { value: 'id', label: 'Idaho' },
  { value: 'il', label: 'Illinois' },
  { value: 'in', label: 'Indiana' },
  { value: 'ia', label: 'Iowa' },
  { value: 'ks', label: 'Kansas' },
  { value: 'ky', label: 'Kentucky' },
  { value: 'la', label: 'Louisiana' },
  { value: 'me', label: 'Maine' },
  { value: 'md', label: 'Maryland' },
  { value: 'ma', label: 'Massachusetts' },
  { value: 'mi', label: 'Michigan' },
  { value: 'mn', label: 'Minnesota' },
  { value: 'ms', label: 'Mississippi' },
  { value: 'mo', label: 'Missouri' },
  { value: 'mt', label: 'Montana' },
  { value: 'ne', label: 'Nebraska' },
  { value: 'nv', label: 'Nevada' },
  { value: 'nh', label: 'New Hampshire' },
  { value: 'nj', label: 'New Jersey' },
  { value: 'nm', label: 'New Mexico' },
  { value: 'ny', label: 'New York' },
  { value: 'nd', label: 'North Dakota' },
  { value: 'oh', label: 'Ohio' },
  { value: 'ok', label: 'Oklahoma' },
  { value: 'or', label: 'Oregon' },
  { value: 'pa', label: 'Pennsylvania' },
  { value: 'ri', label: 'Rhode Island' },
  { value: 'sc', label: 'South Carolina' },
  { value: 'sd', label: 'South Dakota' },
  { value: 'tn', label: 'Tennessee' },
  { value: 'tx', label: 'Texas' },
  { value: 'ut', label: 'Utah' },
  { value: 'vt', label: 'Vermont' },
  { value: 'va', label: 'Virginia' },
  { value: 'wa', label: 'Washington' },
  { value: 'wv', label: 'West Virginia' },
  { value: 'wi', label: 'Wisconsin' },
  { value: 'wy', label: 'Wyoming' }
];

function AdminPage() {
  const [selectedState, setSelectedState] = useState(null);
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [commonColumns, setCommonColumns] = useState([]);
  const [table1Columns, setTable1Columns] = useState([]);
  const [table2Columns, setTable2Columns] = useState([]);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showConfirmationInput, setShowConfirmationInput] = useState(false);

  const handleStateChange = (selectedOption) => {
    setSelectedState(selectedOption);
  };

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    setFile(uploadedFile);

    // Read the CSV file and extract column names
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const lines = content.split('\n');
      if (lines.length > 0) {
        const headers = lines[0].split(',');
        setColumns(headers.map(header => ({ id: header.trim(), content: header.trim() })));
      }
    };
    reader.readAsText(uploadedFile);
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    const sourceList = 
      source.droppableId === 'availableColumns' ? columns :
      source.droppableId === 'commonColumns' ? commonColumns :
      source.droppableId === 'table1' ? table1Columns : table2Columns;
    
    const setSourceList = 
      source.droppableId === 'availableColumns' ? setColumns :
      source.droppableId === 'commonColumns' ? setCommonColumns :
      source.droppableId === 'table1' ? setTable1Columns : setTable2Columns;
    
    const destList = 
      destination.droppableId === 'availableColumns' ? columns :
      destination.droppableId === 'commonColumns' ? commonColumns :
      destination.droppableId === 'table1' ? table1Columns : table2Columns;
    
    const setDestList = 
      destination.droppableId === 'availableColumns' ? setColumns :
      destination.droppableId === 'commonColumns' ? setCommonColumns :
      destination.droppableId === 'table1' ? setTable1Columns : setTable2Columns;

    if (source.droppableId === destination.droppableId) {
      const newItems = Array.from(sourceList);
      const [reorderedItem] = newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, reorderedItem);
      setSourceList(newItems);
    } else {
      const sourceItems = Array.from(sourceList);
      const destItems = Array.from(destList);
      const [movedItem] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, movedItem);
      setSourceList(sourceItems);
      setDestList(destItems);
    }
  };

  const handleUpload = async () => {
    if (!selectedState || !file || (table1Columns.length === 0 && table2Columns.length === 0 && commonColumns.length === 0)) {
      alert('Please select a state, upload a file, and configure at least one table or common columns.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('state', selectedState.value);
    formData.append('commonColumns', JSON.stringify(commonColumns));
    formData.append('table1Columns', JSON.stringify(table1Columns));
    formData.append('table2Columns', JSON.stringify(table2Columns));

    try {
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Data uploaded successfully!');
      } else {
        alert('Error uploading data. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleSaveConfiguration = async () => {
    if (!selectedState) {
      alert('Please select a state before saving the configuration.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/save-configuration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state: selectedState.value,
          commonColumns,
          table1Columns,
          table2Columns,
        }),
      });

      if (response.ok) {
        alert('Configuration saved successfully!');
      } else {
        alert('Error saving configuration. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleLoadConfiguration = async () => {
    if (!selectedState) {
      alert('Please select a state before loading the configuration.');
      return;
    }
    setShowConfirmationInput(true);
  };

// ... (previous code remains the same)

const confirmLoadConfiguration = async () => {
  if (confirmationCode !== '5673') {
    alert('Invalid confirmation code. Please try again.');
    return;
  }

  try {
    const response = await fetch(`http://localhost:3001/api/load-configuration?state=${selectedState.value}`);
    if (response.ok) {
      const config = await response.json();
      if (config && typeof config === 'object') {
        setCommonColumns(Array.isArray(config.commonColumns) ? config.commonColumns : []);
        setTable1Columns(Array.isArray(config.table1Columns) ? config.table1Columns : []);
        setTable2Columns(Array.isArray(config.table2Columns) ? config.table2Columns : []);
        alert('Configuration loaded successfully!');
      } else {
        throw new Error('Invalid configuration data');
      }
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error loading configuration');
    }
  } catch (error) {
    console.error('Error:', error);
    alert(`An error occurred while loading the configuration: ${error.message}`);
  }

  setShowConfirmationInput(false);
  setConfirmationCode('');
};

  const DroppableArea = ({ id, items, title }) => (
    <div className="column-container">
      <h3 className="column-title">{title}</h3>
      <Droppable droppableId={id}>
        {(provided) => (
          <ul className="column-list" {...provided.droppableProps} ref={provided.innerRef}>
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided) => (
                  <li
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="column-item"
                  >
                    {item.content}
                  </li>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    </div>
  );

  return (
    <div className="admin-container">
      <h1 className="admin-title">Admin Dashboard</h1>
      <div className="admin-content">
        <div className="admin-sidebar">
          <div className="admin-section">
            <h2 className="section-title">Select State</h2>
            <Select
              options={states}
              value={selectedState}
              onChange={handleStateChange}
              placeholder="Choose a state..."
              className="state-select"
            />
          </div>
          <div className="admin-section">
            <h2 className="section-title">Upload CSV File</h2>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="file-input" />
          </div>
          <div className="admin-section">
            <button onClick={handleUpload} className="upload-button">
              <Upload className="button-icon" />
              Upload Data
            </button>
          </div>
          <div className="admin-section">
            <button onClick={handleSaveConfiguration} className="config-button">
              <Save className="button-icon" />
              Save Configuration
            </button>
          </div>
          <div className="admin-section">
            <button onClick={handleLoadConfiguration} className="config-button">
              <Download className="button-icon" />
              Load Configuration
            </button>
          </div>
          {showConfirmationInput && (
            <div className="admin-section">
              <input
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                placeholder="Enter confirmation code"
                className="confirmation-input"
              />
              <button onClick={confirmLoadConfiguration} className="confirm-button">
                Confirm Load
              </button>
            </div>
          )}
        </div>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="columns-section">
            <DroppableArea id="availableColumns" items={columns} title="Available Columns" />
            <div className="configured-columns">
              <DroppableArea id="commonColumns" items={commonColumns} title="Common Columns" />
              <DroppableArea id="table1" items={table1Columns} title="Table 1 Columns" />
              <DroppableArea id="table2" items={table2Columns} title="Table 2 Columns" />
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}

export default AdminPage;