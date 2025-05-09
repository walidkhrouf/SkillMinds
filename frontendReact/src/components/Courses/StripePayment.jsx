// StripePayment.jsx
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import PropTypes from 'prop-types';

const stripePromise = loadStripe('pk_test_51R2GwyQngl8IiP8fa2Vjj2DAsyKmsd0Q2beYSsD2sfS9N0HhMLGbht88oGyeokL6u7LN4ddw4P2ZntxnTz1nyfuR00KEQS0zSL');

const PaymentForm = ({ courseId, userId, onPaymentSuccess }) => {
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    const { token, error: stripeError } = await stripe.createToken(elements.getElement(CardElement));

    if (stripeError) {
      setError(stripeError.message);
      setProcessing(false);
      setStatusMessage('Payment failed: ' + stripeError.message);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/courses/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          userId,
          token: token.id
        })
      });

      const data = await response.json();
      if (data.success) {
        setStatusMessage('Payment successful!');
        const enrollResponse = await fetch('http://localhost:5000/api/courses/enroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            userId
          })
        });
        const enrollData = await enrollResponse.json();
        onPaymentSuccess(courseId, enrollData);
      } else {
        setStatusMessage('Payment failed!');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setStatusMessage('Payment failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '10px', backgroundColor: '#f9f9f9', maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <CardElement
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#9e2146',
            },
          },
        }}
      />
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button type="submit" disabled={processing} style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        {processing ? 'Processing...' : 'Pay'}
      </button>
      {statusMessage && <div>{statusMessage}</div>}
    </form>
  );
};

PaymentForm.propTypes = {
  courseId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  onPaymentSuccess: PropTypes.func.isRequired
};

const StripePayment = ({ courseId, userId, onPaymentSuccess }) => (
  <Elements stripe={stripePromise}>
    <PaymentForm courseId={courseId} userId={userId} onPaymentSuccess={onPaymentSuccess} />
  </Elements>
);

StripePayment.propTypes = {
  courseId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  onPaymentSuccess: PropTypes.func.isRequired
};

export default StripePayment;
