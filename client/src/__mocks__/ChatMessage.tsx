import React from 'react';
import { Message } from '../services/api';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div className="chat-message" data-testid="chat-message">
      <div className="message-header">
        <span data-testid="message-role">{message.role}</span>
      </div>
      <div className="message-content" data-testid="message-content">
        {message.content}
      </div>
    </div>
  );
};

export default ChatMessage;