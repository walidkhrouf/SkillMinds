import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './GroupDiscussion.css';

const GroupDiscussion = ({ courseId, userId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize Socket.IO
    socketRef.current = io('http://localhost:5000');

    // Join course discussion
    socketRef.current.emit('joinCourseDiscussion', { courseId, userId });

    // Handle new messages
    socketRef.current.on('newMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Handle errors
    socketRef.current.on('error', ({ message }) => {
      setError(message);
    });

    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/courses/discussion/list', {
          params: { courseId, userId },
        });
        setMessages(response.data);
      } catch (err) {
        setError(err.response?.data.message || 'Error fetching messages');
      }
    };
    fetchMessages();

    return () => {
      socketRef.current.disconnect();
    };
  }, [courseId, userId]);

  // Handle error message disappearance after 5 seconds for bad word detection
  useEffect(() => {
    let timer;
    if (error && error.includes('bad word')) {
      timer = setTimeout(() => {
        setError('');
      }, 5000); // 5 seconds
    }
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      setError('Message cannot be empty');
      return;
    }

    try {
      // Send message to backend for moderation and storage
      const response = await axios.post('http://localhost:5000/api/courses/discussion/create', {
        courseId,
        userId,
        content: newMessage,
      });

      // If successful, the backend will emit the message via Socket.IO
      setNewMessage('');
      setError('');
    } catch (err) {
      setError(err.response?.data.message || 'Error sending message');
    }
  };

  return (
    <div className="group-discussion">
      <h3>Group Discussion</h3>
      {error && <p className="error">{error}</p>}
      <div className="messages-container">
        {messages.length === 0 ? (
          <p>No messages yet. Be the first to post!</p>
        ) : (
          messages.map((message) => (
            <div key={message._id} className="comment">
              <p>
                <strong>{message.userId.username}</strong>: {message.content}
              </p>
              <small>{new Date(message.createdAt).toLocaleString()}</small>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="message-input">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          rows="3"
        />
        <button onClick={handleSendMessage}>Submit</button>
      </div>
    </div>
  );
};

export default GroupDiscussion;