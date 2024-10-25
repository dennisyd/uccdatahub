import React from 'react';
import { Download } from 'lucide-react';
import Button from './ui/Button';
import PayPalButton from './PayPalButton';
import DiscountCode from './DiscountCode';
import { states } from '../constants/formOptions';

function HubActions({
    selectedStates,
    selectedParties,
    dataType,
    role,
    uccType,
    filingDateStart,
    filingDateEnd,
    hasGeneratedCsv,
    setHasGeneratedCsv,
    csvData,
    setCsvData,
    totalRecords,
    setTotalRecords,
    cost,
    setCost,
    discountedCost,
    setDiscountedCost,
    isPaying,
    setIsPaying,
    setDataType,
    setSelectedStates,
    setSelectedParties,
    setRole,
    setUccType,
    setFilingDateStart,
    setFilingDateEnd,
    securedParties
}) {
    const handleGenerateCSV = async () => {
        try {
            if (!selectedStates.length) {
                alert('Please select at least one state');
                return;
            }

            if (!selectedParties.length) {
                alert('Please select at least one secured party');
                return;
            }

            const formattedStates = selectedStates
                .filter((state) => state.value !== 'all')
                .map((state) => state.value.toLowerCase());

            if (selectedStates.some(state => state.value === 'all')) {
                formattedStates.push(...states
                    .filter(state => state.value !== 'all')
                    .map(state => state.value.toLowerCase())
                );
            }

            const formattedParties = selectedParties
                .filter((party) => party.value !== 'all')
                .map((party) => party.value);

            if (selectedParties.some(party => party.value === 'all')) {
                formattedParties.push(...securedParties
                    .filter(party => party.value !== 'all')
                    .map(party => party.value)
                );
            }

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
                    filingDateEnd: filingDateEnd ? filingDateEnd.toISOString().split('T')[0] : null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate CSV');
            }

            const data = await response.json();

            if (!data.csv) {
                throw new Error('No CSV data received from server');
            }

            setCsvData(data.csv);
            setHasGeneratedCsv(true);

            const newTotalRecords = data.recordCount;
            setTotalRecords(newTotalRecords);
            setCost((newTotalRecords * 0.05).toFixed(2));

            alert(`CSV generated successfully. Total records: ${newTotalRecords}`);
        } catch (error) {
            console.error('Error generating CSV:', error);
            alert('An error occurred while generating the CSV: ' + error.message);
        }
    };

    const handlePaymentSuccess = async (order) => {
        try {
            setIsPaying(true);

            // Verify the payment with your server
            const response = await fetch('http://localhost:3001/api/verify-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderID: order.id,
                    csvData: csvData,
                    amount: discountedCost || cost,
                    recordCount: totalRecords,
                    userId: localStorage.getItem('userId')
                }),
            });

            const data = await response.json();
            if (data.success) {
                try {
                    // Generate the full URL using the backend server address
                    const userId = localStorage.getItem('userId');
                    const transactionId = data.transactionId;
                    const downloadUrl = `http://localhost:3001/api/download-transaction/${transactionId}/${userId}`;

                    // Create a fetch request to get the CSV data
                    const downloadResponse = await fetch(downloadUrl);
                    if (!downloadResponse.ok) {
                        throw new Error('Download failed');
                    }

                    // Get the CSV content
                    const csvContent = await downloadResponse.text();

                    // Create a Blob and download link
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = `ucc_data_${transactionId}.csv`;
                    
                    // Trigger download
                    document.body.appendChild(a);
                    a.click();
                    
                    // Cleanup
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    // Show success message and ask user preference
                    const startNew = window.confirm(
                        'Download started! Would you like to start a new search? (Your current data will be cleared)'
                    );

                    if (startNew) {
                        resetForm();
                    } else {
                        setIsPaying(false);
                        setHasGeneratedCsv(false);
                        alert('You can find this download in your transaction history if needed.');
                    }

                } catch (downloadError) {
                    console.error('Download error:', downloadError);
                    alert(
                        'Error starting download. You can find this purchase in your transaction history to download later.'
                    );
                    setIsPaying(false);
                }
            } else {
                throw new Error(data.message || 'Payment verification failed');
            }
        } catch (error) {
            console.error('Payment processing failed:', error);
            alert('Error processing payment: ' + error.message);
            setIsPaying(false);
        }
    };

    const resetForm = () => {
        // Clear data states
        setCsvData(null);
        setHasGeneratedCsv(false);
        setIsPaying(false);

        // Reset form fields
        setDataType('basic');
        setSelectedStates([]);
        setSelectedParties([]);
        setRole('all');
        setUccType('contactInfo');
        setFilingDateStart(null);
        setFilingDateEnd(null);

        // Clear cost and records
        setTotalRecords(0);
        setCost(0);
        setDiscountedCost(null);
    };

    return (
        <div className="action-buttons">
            <Button
                className="generate-csv-button"
                onClick={handleGenerateCSV}
                disabled={isPaying || !selectedStates.length || !selectedParties.length}
            >
                <Download className="button-icon" />
                {hasGeneratedCsv ? 'Regenerate CSV' : 'Generate CSV'}
            </Button>

            {hasGeneratedCsv && (
                <div className="payment-section">
                    <div className="cost-display mb-4">
                        <p className="text-lg font-medium">
                            Records: {totalRecords}
                        </p>
                        <p className="text-xl font-bold">
                            Total Cost: ${Number(cost).toFixed(2)}
                        </p>
                    </div>

                    <DiscountCode
                        onApplyDiscount={(discountedAmount) => setDiscountedCost(discountedAmount)}
                        originalCost={cost}
                    />

                    <PayPalButton
                        amount={discountedCost || cost}
                        onSuccess={handlePaymentSuccess}
                        onError={(error) => {
                            console.error('PayPal error:', error);
                            alert('Payment failed');
                            setIsPaying(false);
                        }}
                        disabled={!hasGeneratedCsv || isPaying}
                    />
                </div>
            )}
        </div>
    );
}

export default HubActions;