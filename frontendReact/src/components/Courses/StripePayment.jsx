import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import PropTypes from 'prop-types';  // Import PropTypes

const stripePromise = loadStripe('pk_test_51R2GwyQngl8IiP8fa2Vjj2DAsyKmsd0Q2beYSsD2sfS9N0HhMLGbht88oGyeokL6u7LN4ddw4P2ZntxnTz1nyfuR00KEQS0zSL');  // Remplace par ta clé publique

const PaymentForm = ({ courseId, userId }) => {
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');  // Ajout de l'état pour le message de statut
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    // Créer un token de paiement avec Stripe Elements
    const { token, error: stripeError } = await stripe.createToken(elements.getElement(CardElement));

    if (stripeError) {
      setError(stripeError.message);
      setProcessing(false);
      setStatusMessage('Payment failed: ' + stripeError.message);  // Message d'échec
      return;
    }

    // Envoyer le token et les informations du cours à l'API backend
    try {
      const response = await fetch('http://localhost:5000/api/courses/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          userId,
          token: token.id  // Le token reçu de Stripe Elements
        })
      });

      const data = await response.json();
      if (data.success) {
        setStatusMessage('Payment successful!');  // Message de succès
      } else {
        setStatusMessage('Payment failed!');  // Message d'échec
      }
    } catch (error) {
      console.error('Payment error:', error);
      setStatusMessage('Payment failed: ' + error.message);  // Message d'échec
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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
      {error && <div>{error}</div>}
      <button type="submit" disabled={processing}>
        {processing ? 'Processing...' : 'Pay'}
      </button>
      {statusMessage && <div>{statusMessage}</div>}  {/* Affichage du message de statut */}
    </form>
  );
};

// Ajout de la validation PropTypes
PaymentForm.propTypes = {
  courseId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired
};

const StripePayment = ({ courseId, userId }) => (
  <Elements stripe={stripePromise}>
    <PaymentForm courseId={courseId} userId={userId} />
  </Elements>
);

// Ajout de la validation PropTypes pour StripePayment
StripePayment.propTypes = {
  courseId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired
};

export default StripePayment;
