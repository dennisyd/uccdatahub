import React, { useState } from 'react';
import { PayPalButtons } from "@paypal/react-paypal-js";

function PayPalButton({ amount, onSuccess, onError, disabled }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  const createOrder = (data, actions) => {
    try {
      console.log('Creating PayPal order with amount:', amount);
      
      const formattedAmount = Math.max(0.01, Number(amount)).toFixed(2);
      console.log('Formatted amount:', formattedAmount);

      return actions.order.create({
        purchase_units: [
          {
            amount: {
              value: formattedAmount,
              currency_code: "USD"
            },
            description: "UCC Data Export"
          }
        ],
        application_context: {
          shipping_preference: "NO_SHIPPING"
        }
      }).then(orderId => {
        console.log('PayPal order created successfully:', orderId);
        return orderId;
      }).catch(err => {
        console.error('Error creating PayPal order:', err);
        throw err;
      });
    } catch (err) {
      console.error('Error in createOrder:', err);
      throw err;
    }
  };

  const onApprove = async (data, actions) => {
    try {
      setIsProcessing(true);
      console.log('Payment approved, full PayPal data:', data);
      
      // Log the orderId specifically
      console.log('Order ID:', data.orderID);
      
      // Set payment complete before calling onSuccess
      setPaymentComplete(true);
      
      // Call onSuccess and await its completion
      await onSuccess({
        orderID: data.orderID,
        payerID: data.payerID,
        paymentSource: data.paymentSource,
        paymentID: data.paymentID
      });
      
      console.log('Success callback completed');
      
    } catch (err) {
      console.error('Error in onApprove:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        data: err.data
      });
      onError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleError = (err) => {
    console.error('PayPal error:', {
      message: err.message,
      stack: err.stack,
      data: err.data
    });
    setIsProcessing(false);
    onError(err);
  };

  const handleCancel = (data) => {
    console.log('Payment cancelled by user:', data);
    setIsProcessing(false);
  };

  if (amount && (isNaN(amount) || amount <= 0)) {
    return (
      <div className="text-red-600">
        Invalid amount specified
      </div>
    );
  }

  return (
    <div className={`paypal-button-container ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {amount > 0 ? (
        <>
          <div className="mb-4 text-lg font-medium">
            Total Cost: ${Number(amount).toFixed(2)}
          </div>
          {isProcessing && (
            <div className="mb-4 text-blue-600">
              Processing payment, please wait...
            </div>
          )}
          {paymentComplete ? (
            <div className="p-4 bg-green-100 text-green-700 rounded-md mb-4">
              Payment successful! Processing your download...
            </div>
          ) : (
            <PayPalButtons
              createOrder={createOrder}
              onApprove={onApprove}
              onError={handleError}
              onCancel={handleCancel}
              style={{ 
                layout: "horizontal",
                color: "gold",
                shape: "rect",
                label: "paypal"
              }}
              disabled={disabled || isProcessing}
              forceReRender={[amount]}
            />
          )}
        </>
      ) : (
        <div className="text-gray-600">
          Generate a CSV first to see the total cost
        </div>
      )}
    </div>
  );
}

export default PayPalButton;