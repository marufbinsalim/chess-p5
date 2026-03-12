import React, { useState, useRef, useEffect } from 'react';

interface ChatProps {
  messages: string[];
  onSendMessage: (message: string) => void;
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="chat">
      <div className="chat-header">
        <h3>Chat</h3>
      </div>
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className="chat-message">
              <div className="message-avatar"></div>
              <div className="message-content">
                <div className="message-text">{message}</div>
                <div className="message-time">{new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="chat-input-field"
        />
        <button
          onClick={handleSendMessage}
          className="chat-send-btn"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
