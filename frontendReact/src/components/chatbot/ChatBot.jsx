import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaRobot, FaPaperPlane, FaTimes, FaSpinner, FaComments } from "react-icons/fa";
import "./ChatBot.css";

export default function ChatBot() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const boxRef = useRef(null);

    useEffect(() => {
        setMessages([
            { role: "bot", content: "Hello! I'm your AI assistant. How can I help you today? 🤖", timestamp: new Date() }
        ]);
    }, []);

    const send = async () => {
        if (!input.trim()) return;
        const userMsg = { role: "user", content: input.trim(), timestamp: new Date() };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await axios.post("http://localhost:5000/api/chat", {
                message: input.trim()
            });
            setMessages((prev) => [...prev, { role: "bot", content: res.data.reply, timestamp: new Date() }]);
        } catch {
            setMessages((prev) => [...prev, { role: "bot", content: "Oops, something went wrong. Please try again!", timestamp: new Date() }]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (boxRef.current) {
            boxRef.current.scrollTop = boxRef.current.scrollHeight;
        }
    }, [messages]);

    const formatTimestamp = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="chatbot-container">
            <motion.button
                className="chatbot-toggle"
                onClick={() => setOpen((o) => !o)}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.2, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300 }}
            >
                {open ? <FaTimes size={24} /> : <span className="robot-emoji">🤖</span>}
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        className="chatbot-window"
                        initial={{ opacity: 0, y: 50, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 200 }}
                    >
                        <div className="chatbot-header">
                            <FaComments size={20} className="header-icon" />
                            <span>AI Assistant</span>
                        </div>
                        <div className="messages" ref={boxRef}>
                            {messages.map((m, i) => (
                                <motion.div
                                    key={i}
                                    className={`message ${m.role}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <span className="message-icon">
                                        {m.role === "bot" ? <FaRobot size={16} /> : "👤"}
                                    </span>
                                    <div className="message-body">
                                        <span className="message-content">{m.content}</span>
                                        <span className="message-timestamp">{formatTimestamp(m.timestamp)}</span>
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <motion.div
                                    className="message bot loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <FaSpinner className="spinner" size={16} />
                                    <span>Thinking...</span>
                                </motion.div>
                            )}
                        </div>
                        <div className="input-area">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && send()}
                                placeholder="Type your message..."
                            />
                            <motion.button
                                className="send-btn"
                                onClick={send}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                disabled={isLoading}
                            >
                                <FaPaperPlane size={16} />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}