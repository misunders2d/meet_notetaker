
import React, { useRef, useEffect } from 'react';
import { Message } from '../types';

interface ChatLogProps {
  messages: Message[];
}

const ChatLog: React.FC<ChatLogProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={scrollRef} className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-800">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No messages yet. Send a message or use the mic.</p>
        </div>
      ) : (
        messages.map((msg) => (
          <div key={msg.id} className="flex flex-col">
            <p className="text-sm text-gray-400 font-semibold">{msg.sender} said:</p>
            <div className="mt-1 bg-gray-700 p-3 rounded-lg max-w-xs break-words">
              <p className="text-gray-200">{msg.text}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ChatLog;
