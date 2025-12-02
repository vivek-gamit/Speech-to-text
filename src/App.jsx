import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Copy, 
  Trash2, 
  Volume2, 
  Save, 
  History,
  Download
} from 'lucide-react';

// Check for browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Refs for managing the speech recognition instance
  const recognitionRef = useRef(null);

  // Load history from local storage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('speech-notes-history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;      // Keep listening even if user pauses
      recognition.interimResults = true;  // Show results while speaking
      recognition.lang = 'en-US';         // Default language

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Append new final results to existing text
        if (finalTranscript) {
            setText(prev => prev + finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setError(`Error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        // If we simply stopped speaking but didn't click stop, restart (unless manually stopped)
        // Note: In a production app, you might want more complex logic here
        if (isListening) {
           // recognition.start(); 
           // Optional: keep it continuous by restarting, but simple toggle is often better UX
           setIsListening(false); 
        }
      };

      recognitionRef.current = recognition;
    } else {
      setError("Browser not supported. Please use Google Chrome.");
    }
  }, []); // Empty dependency array means this runs once on mount

  // Toggle Listening
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setText(''); // Optional: Clear text on new session, or remove this line to append
      recognitionRef.current.start();
      setIsListening(true);
      setError('');
    }
  };

  // Copy to Clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Text to Speech (Read Aloud)
  const readAloud = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech not supported in this browser.");
    }
  };

  // Save to History
  const saveToHistory = () => {
    if (!text.trim()) return;
    const newEntry = {
      id: Date.now(),
      text: text,
      date: new Date().toLocaleString()
    };
    const updatedHistory = [newEntry, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('speech-notes-history', JSON.stringify(updatedHistory));
    setText(''); // Clear current board
  };

  // Download as Text File
  const downloadTxtFile = () => {
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "meeting-notes.txt";
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-blue-600 mb-2">VoiceNotes AI</h1>
          <p className="text-gray-500">Professional Speech-to-Text Converter for Meetings</p>
        </header>

        {/* Main Interface */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          
          {/* Toolbar */}
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex flex-wrap gap-3 justify-between items-center">
             <div className="flex gap-2">
                <button 
                  onClick={toggleListening}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-200 shadow-lg' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 shadow-lg'
                  }`}
                >
                  {isListening ? <><MicOff size={18} /> Stop Recording</> : <><Mic size={18} /> Start Recording</>}
                </button>
                <span className="flex items-center text-sm text-gray-400 ml-2">
                  {isListening ? 'Listening...' : 'Click start to speak'}
                </span>
             </div>

             <div className="flex gap-2">
                <button onClick={copyToClipboard} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg tooltip" title="Copy Text">
                  {copySuccess ? <span className="text-green-500 font-bold text-xs">Copied!</span> : <Copy size={20} />}
                </button>
                <button onClick={readAloud} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg" title="Read Aloud">
                  <Volume2 size={20} />
                </button>
                <button onClick={downloadTxtFile} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg" title="Download Text">
                  <Download size={20} />
                </button>
                <button onClick={() => setText('')} className="p-2 text-gray-500 hover:bg-red-100 hover:text-red-500 rounded-lg" title="Clear Text">
                  <Trash2 size={20} />
                </button>
             </div>
          </div>

          {/* Text Area */}
          <div className="relative h-96 p-6">
            <textarea 
              className="w-full h-full resize-none outline-none text-lg text-gray-700 leading-relaxed placeholder-gray-300"
              placeholder="Your speech will appear here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            ></textarea>
            
            {/* Save Button Floating */}
            <button 
              onClick={saveToHistory}
              disabled={!text}
              className="absolute bottom-6 right-6 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={18} /> Save Note
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200 text-center">
            {error}
          </div>
        )}

        {/* History Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
               <History size={24} /> Saved Notes
             </h2>
             <button 
               onClick={() => setShowHistory(!showHistory)}
               className="text-blue-600 hover:text-blue-800 underline text-sm"
             >
               {showHistory ? 'Hide History' : 'Show History'}
             </button>
          </div>

          {showHistory && (
            <div className="grid gap-4 md:grid-cols-2">
              {history.length === 0 ? (
                <p className="text-gray-400 italic">No saved notes yet.</p>
              ) : (
                history.map((note) => (
                  <div key={note.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <p className="text-gray-800 text-sm line-clamp-3 mb-3">{note.text}</p>
                    <div className="flex justify-between items-center text-xs text-gray-400 border-t pt-2">
                      <span>{note.date}</span>
                      <button 
                        onClick={() => {
                          const newHistory = history.filter(h => h.id !== note.id);
                          setHistory(newHistory);
                          localStorage.setItem('speech-notes-history', JSON.stringify(newHistory));
                        }}
                        className="text-red-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}