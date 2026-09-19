import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Bot, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWearable } from '../contexts/WearableContext';
import { useWellness } from '../contexts/WellnessContext';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { api } from '../services/api';

export const VoicePage: React.FC = () => {
  const { user } = useAuth();
  const { currentMode } = useWearable();
  const { triggerCrisis } = useWellness();

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [replyText, setReplyText] = useState(
    "Hello Alex. I'm your calm voice companion. Press the microphone below and speak naturally whenever you're ready."
  );
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = async (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setIsListening(false);
        await handleSpeechTurn(text);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        setIsListening(false);
        if (event.error !== 'no-speech') {
          setVoiceError(`Microphone notice: ${event.error}. You can also use the text simulator below.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setVoiceError("Browser Web Speech API not natively available on this browser. Voice simulation mode is enabled.");
    }
  }, []);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.94; // Calm, patient cadence
      utterance.pitch = 1.0; // Natural, reassuring tone

      // Try to pick a natural soft voice if available
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(v => v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Google US English'));
      if (naturalVoice) utterance.voice = naturalVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSpeechTurn = async (spokenText: string) => {
    setVoiceError(null);
    try {
      const res = await api.processVoiceTurn(spokenText, currentMode);
      if (res.safety_interception) {
        triggerCrisis({
          risk_level: 'CRITICAL',
          category: 'crisis_voice_detected',
          title: 'Immediate Crisis Support Available',
          message: res.reply_text,
          resources: [
            { name: '988 Suicide & Crisis Lifeline', phone: '988' },
            { name: 'Crisis Text Line', sms: 'Text HOME to 741741' }
          ],
          disclaimer: 'MindCare AI does not provide emergency medical intervention.'
        });
      }
      setReplyText(res.reply_text);
      speakText(res.reply_text);
    } catch (err: any) {
      console.error('Voice processing error:', err);
      const fallback = "I heard you, and I appreciate you sharing. Remember to pause and take a steady breath as we navigate your day.";
      setReplyText(fallback);
      speakText(fallback);
    }
  };

  const toggleListening = () => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.warn('Recognition start exception:', e);
        }
      } else {
        // Mock turn for demo
        const demoQueries = [
          "I'm feeling quite exhausted after today's lectures.",
          "Can you suggest a quick way to ease exam stress?",
          "How does physical activity help my resting heart rate?"
        ];
        const randomQ = demoQueries[Math.floor(Math.random() * demoQueries.length)];
        setTranscript(randomQ);
        handleSpeechTurn(randomQ);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <DisclaimerBanner compact />

      {/* Voice Assistant Visualizer Card */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs text-center flex flex-col items-center">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold border border-purple-200 mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Calm & Empathetic Voice Companion</span>
        </div>

        {/* Animated Waveform / Pulse Sphere */}
        <div className="relative w-48 h-48 flex items-center justify-center my-6">
          <div
            className={`absolute w-40 h-40 rounded-full bg-purple-100 transition-all duration-700 ${
              isSpeaking
                ? 'scale-125 opacity-60 animate-ping'
                : isListening
                ? 'scale-110 opacity-80 animate-pulse'
                : 'scale-90 opacity-40'
            }`}
          />
          <div
            className={`absolute w-32 h-32 rounded-full bg-purple-200/80 transition-all duration-300 ${
              isSpeaking ? 'scale-110' : ''
            }`}
          />
          <button
            onClick={toggleListening}
            className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-transform transform active:scale-95 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : isSpeaking
                ? 'bg-purple-700 text-white'
                : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white hover:opacity-95'
            }`}
            title={isListening ? 'Stop listening' : 'Start speaking'}
          >
            {isListening ? <MicOff className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
          </button>
        </div>

        {/* Status Text */}
        <div className="mt-2">
          <p className="text-sm font-bold text-slate-800">
            {isListening ? 'Listening to your voice...' : isSpeaking ? 'Companion Speaking...' : 'Tap to Speak'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Voice persona: Warm, patient, soft-spoken, non-judgmental
          </p>
        </div>

        {/* User Speech Transcript */}
        {transcript && (
          <div className="mt-6 w-full max-w-md bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">You Spoke</p>
            <p className="text-xs text-slate-700 italic">"{transcript}"</p>
          </div>
        )}

        {/* Assistant Reply Card */}
        <div className="mt-4 w-full max-w-lg bg-purple-50/50 p-5 rounded-2xl border border-purple-100 text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-purple-900">MindCare Voice Reply</span>
            </div>
            {isSpeaking && (
              <span className="flex items-center space-x-1 text-[10px] text-purple-700 font-semibold">
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                <span>Audio Playing</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-800 leading-relaxed">{replyText}</p>
        </div>

        {/* Simulation / Quick Test Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-100 w-full">
          <p className="text-xs font-semibold text-slate-500 mb-3">Or test simulated spoken queries:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "I'm feeling very overwhelmed with coursework",
              "Can you suggest a calming evening routine?",
              "I just finished a workout and feel energized"
            ].map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTranscript(q);
                  handleSpeechTurn(q);
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 transition-colors"
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
