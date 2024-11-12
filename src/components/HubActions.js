import React from 'react';
import { Download } from 'lucide-react';
import Button from './ui/Button';
import PayPalButton from './PayPalButton';
import DiscountCode from './DiscountCode';
import { states } from '../constants/formOptions';
import { useUser } from '../contexts/UserContext';

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
    const { user } = useUser();

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

            let securedPartiesString = 'all';
            if (!selectedParties.some(party => party.value === 'all')) {
                // Only format parties if not selecting 'all'
                const formattedParties = selectedParties.map(party =>
                    // Escape any single quotes in party names
                    `'${party.value.replace(/'/g, "''")}'`
                ).join(',');
                securedPartiesString = formattedParties;
            }

            const response = await fetch('http://localhost:3001/api/generate-csv', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    states: formattedStates,
                    dataType,
                    selectedParties: securedPartiesString,
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

    const handlePaymentSuccess = async (data) => {
        try {
            setIsPaying(true);
            console.log('Starting payment processing with data:', data);

            const userId = user.userId;
            console.log('Retrieved userId:', userId);

            if (!userId) {
                throw new Error('User ID not found. Please log in again.');
            }

            const requestBody = {
                orderID: data.orderID,
                csvData: csvData,
                amount: discountedCost || cost,
                recordCount: totalRecords,
                userId: userId
            };

            const response = await fetch('http://localhost:3001/api/verify-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(`Payment verification failed: ${result.message || response.statusText}`);
            }

            if (result.success) {
                try {
                    const downloadResponse = await fetch(
                        `http://localhost:3001/api/download-transaction/${result.transactionId}/${userId}`,
                        {
                            method: 'GET',
                            headers: {
                                'Accept': 'text/csv',
                            },
                        }
                    );

                    if (!downloadResponse.ok) {
                        const errorText = await downloadResponse.text();
                        throw new Error(`Download failed: ${errorText}`);
                    }

                    const blob = await downloadResponse.blob();
                    const url = window.URL.createObjectURL(blob);
                    
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = `ucc_data_${result.transactionId}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    alert('Download complete! The file has been saved to your downloads folder.');
                    
                    const startNew = window.confirm(
                        'Would you like to start a new search? (Your current data will be cleared)'
                    );

                    if (startNew) {
                        resetForm();
                    } else {
                        setIsPaying(false);
                        setHasGeneratedCsv(false);
                    }

                } catch (downloadError) {
                    console.error('Download error:', downloadError);
                    throw new Error(`Download failed: ${downloadError.message}`);
                }
            } else {
                throw new Error(result.message || 'Payment verification failed');
            }
        } catch (error) {
            console.error('Payment/download error:', error);
            alert(`Error occurred: ${error.message}`);
        } finally {
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