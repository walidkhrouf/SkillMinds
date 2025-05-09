import { useState } from 'react';
import './ChatBot.css';
import PropTypes from 'prop-types';  // Import PropTypes

const ChatBot = ({ onRecommend, onClose }) => {
  const [messages, setMessages] = useState([
    { text: 'Bonjour! Quelle compétence recherchez-vous?', sender: 'bot' }
  ]);
  const [userInput, setUserInput] = useState('');

  const handleSendMessage = () => {
    if (!userInput) return;

    setMessages(prevMessages => [
      ...prevMessages,
      { text: userInput, sender: 'user' }
    ]);

    onRecommend(userInput); // Appeler la fonction de recommandation avec l'input de l'utilisateur

    setUserInput('');
  };

  const handleClose = () => {
    onClose(); // Appeler la fonction onClose pour fermer le chatbot
  };

  return (
    <div className="chatbot">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={msg.sender}>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Votre réponse..."
        />
        <button onClick={handleSendMessage}>Envoyer</button>
      </div>
      <button onClick={handleClose} className="close-btn">
        &times; 
      </button>
    </div>
  );
};

// Définir les PropTypes
ChatBot.propTypes = {
  onRecommend: PropTypes.func.isRequired,  // La fonction onRecommend est obligatoire et doit être de type fonction
  onClose: PropTypes.func.isRequired       // La fonction onClose est obligatoire et doit être de type fonction
};

export default ChatBot;
