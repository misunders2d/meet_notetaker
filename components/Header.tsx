
import React from 'react';

interface HeaderProps {
  isRecording: boolean;
}

const Header: React.FC<HeaderProps> = ({ isRecording }) => {
  return (
    <header className="p-4 bg-gray-900 border-b border-gray-700 flex items-center justify-between">
      <h1 className="text-lg font-bold text-gray-200">Meet Echo</h1>
      <div className="flex items-center space-x-2">
        <span className={`h-3 w-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></span>
        <span className="text-sm text-gray-400">{isRecording ? 'Listening' : 'Idle'}</span>
      </div>
    </header>
  );
};

export default Header;
