
import React, { useState, useRef, useCallback } from 'react';
// FIX: Removed non-exported 'LiveSession' type.
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import type { Message } from './types';
import { createPcmBlob } from './utils/audio';

import Header from './components/Header';
import ChatLog from './components/ChatLog';
import UserInput from './components/UserInput';

const App: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // FIX: Replaced 'LiveSession' with 'any' as it's not an exported type from the SDK.
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const currentTranscriptionRef = useRef('');

  const addMessage = (sender: string, text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender, text },
    ]);
  };

  const handleSendMessage = () => {
    addMessage(userName, currentMessage);
    setCurrentMessage('');
  };

  const stopRecording = useCallback(async () => {
    if (sessionPromiseRef.current) {
        const session = await sessionPromiseRef.current;
        session.close();
        sessionPromiseRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsRecording(false);
    setIsConnecting(false);
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording || isConnecting) return;

    setIsConnecting(true);
    currentTranscriptionRef.current = '';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = context;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          inputAudioTranscription: {},
          responseModalities: [Modality.AUDIO], // Required by Live API, but we'll ignore audio output.
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsRecording(true);
            const source = context.createMediaStreamSource(stream);
            const scriptProcessor = context.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(context.destination);
          },
          onmessage: (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              currentTranscriptionRef.current += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.turnComplete) {
              const fullTranscription = currentTranscriptionRef.current;
              if (fullTranscription) {
                addMessage(userName, fullTranscription);
              }
              currentTranscriptionRef.current = '';
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Gemini Live API Error:', e);
            addMessage('System', `An error occurred: ${e.message}. Please try again.`);
            stopRecording();
          },
          onclose: () => {
             // Handled by user action via stopRecording
          },
        },
      });
      await sessionPromiseRef.current;
    } catch (error) {
      console.error('Failed to start recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      addMessage('System', `Could not start microphone: ${errorMessage}`);
      stopRecording();
    }
  }, [isRecording, isConnecting, userName, stopRecording]);


  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-800 text-gray-100 font-sans">
      <Header isRecording={isRecording} />
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-1">Your Name</label>
        <input
          id="username"
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter your name to start"
          disabled={isRecording || isConnecting || messages.length > 0}
          className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>
      <ChatLog messages={messages} />
      <UserInput
        currentMessage={currentMessage}
        setCurrentMessage={setCurrentMessage}
        sendMessage={handleSendMessage}
        toggleRecording={handleToggleRecording}
        isRecording={isRecording}
        isConnecting={isConnecting}
        isNameSet={!!userName.trim()}
      />
    </div>
  );
};

export default App;