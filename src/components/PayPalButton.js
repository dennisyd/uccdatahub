import React, { useState } from 'react';
import { PayPalButtons } from "@paypal/react-paypal-js";

function PayPalButton({ amount, onSuccess, onError, disabled }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  const createOrder = (data, actions) => {
    console.log('Creating PayPal order with amount:', amount);
    
    // Ensure amount is properly formatted and greater than 0
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
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW"
      }
    }).then(orderId => {
      console.log('Order created successfully:', orderId);
      return orderId;
    }).catch(err => {
      console.error('Error creating order:', err);
      throw err;
    });
  };

  const onApprove = async (data, actions) => {
    try {
      setIsProcessing(true);
      console.log('Payment approved, capturing order:', data.orderID);
      
      // First capture the order
      const capturedOrder = await actions.order.capture();
      console.log('Order captured successfully:', capturedOrder);

      // Set payment as complete
      setPaymentComplete(true);
      
      // Trigger success callback
      onSuccess(capturedOrder);
      
    } catch (err) {
      console.error('Error processing payment:', err);
      onError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleError = (err) => {
    console.error('PayPal error:', err);
    setIsProcessing(false);
    onError(err);
  };

  const handleCancel = (data) => {
    console.log('Payment cancelled by user:', data);
    setIsProcessing(false);
  };

  // Add validation for amount
  if (amount && (isNaN(amount) || amount <= 0)) {
    console.error('Invalid amount:', amount);
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
              Payment successful! Your download will begin automatically.
              If it doesn't start, <button 
                onClick={() => onSuccess({ id: 'manual-download' })}
                className="text-green-800 underline"
              >
                click here
              </button>
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
              forceReRender={[amount]} // Force re-render when amount changes
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