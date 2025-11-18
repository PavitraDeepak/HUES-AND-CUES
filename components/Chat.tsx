import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  type: 'player' | 'system';
  playerName?: string;
  message: string;
  timestamp: Date;
}

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-bold text-white">Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[200px] max-h-[400px]">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`${
              msg.type === 'system'
                ? 'text-gray-400 text-sm italic text-center'
                : 'bg-gray-700 p-2 rounded-lg'
            }`}
          >
            {msg.type === 'player' && (
              <>
                <span className="font-bold text-blue-400">{msg.playerName}: </span>
                <span className="text-white">{msg.message}</span>
              </>
            )}
            {msg.type === 'system' && msg.message}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={200}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
