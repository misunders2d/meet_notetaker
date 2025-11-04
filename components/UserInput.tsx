
import React from 'react';
import MicIcon from './icons/MicIcon';
import SendIcon from './icons/SendIcon';

interface UserInputProps {
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  sendMessage: () => void;
  toggleRecording: () => void;
  isRecording: boolean;
  isConnecting: boolean;
  isNameSet: boolean;
}

const UserInput: React.FC<UserInputProps> = ({
  currentMessage,
  setCurrentMessage,
  sendMessage,
  toggleRecording,
  isRecording,
  isConnecting,
  isNameSet,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentMessage.trim()) {
      sendMessage();
    }
  };

  const micButtonClasses = isRecording
    ? 'bg-red-600 text-white hover:bg-red-700'
    : 'bg-gray-600 text-gray-300 hover:bg-gray-500';
  
  const micButtonText = isConnecting ? 'Connecting...' : isRecording ? 'Stop' : 'Start';

  return (
    <div className="p-4 bg-gray-900 border-t border-gray-700">
        {!isNameSet && (
            <div className="text-center text-yellow-400 text-sm mb-2 p-2 bg-yellow-900 bg-opacity-50 rounded-md">
                Please set your name to enable input.
            </div>
        )}
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={!isNameSet || isRecording}
          className="flex-1 bg-gray-700 border border-gray-600 rounded-full py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          onClick={sendMessage}
          disabled={!isNameSet || !currentMessage.trim()}
          className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          <SendIcon className="h-5 w-5" />
        </button>
        <button
          onClick={toggleRecording}
          disabled={!isNameSet || isConnecting}
          className={`p-3 rounded-full transition-colors ${micButtonClasses} disabled:bg-gray-500 disabled:cursor-wait`}
          aria-label={micButtonText}
        >
          <MicIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default UserInput;
