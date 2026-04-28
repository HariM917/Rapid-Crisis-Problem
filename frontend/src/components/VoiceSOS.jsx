import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VoiceSOS = ({ onTranscription }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        const current = event.resultIndex;
        const result = event.results[current][0].transcript;
        setTranscript(result);
      };

      rec.onend = () => {
        setIsListening(false);
        if (transcript) {
          onTranscription(transcript);
        }
      };

      setRecognition(rec);
    }
  }, [transcript, onTranscription]);

  const toggleListening = () => {
    if (isListening) {
      recognition.stop();
    } else {
      setTranscript('');
      recognition.start();
      setIsListening(true);
    }
  };

  if (!recognition) {
    return <div className="text-red-400 text-sm">Speech recognition not supported in this browser.</div>;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleListening}
        className={`p-6 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-700'} 
                   text-white shadow-lg transition-colors`}
      >
        {isListening ? <Mic size={32} /> : <MicOff size={32} />}
      </motion.button>
      
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <p className="text-slate-400 text-sm mb-2">Listening...</p>
            <p className="text-white font-medium italic">"{transcript || '...'}"</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceSOS;
