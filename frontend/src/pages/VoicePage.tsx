import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  AlertCircle,
  Square,
  RotateCcw,
  Radio,
  History,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWearable } from '../contexts/WearableContext';
import { useWellness } from '../contexts/WellnessContext';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { api } from '../services/api';
import type { VoiceState, VoiceMode, ChatMessage } from '../types';

export const VoicePage: React.FC = () => {
  const { user } = useAuth();
  const { currentMode, readings } = useWearable();
  const { triggerCrisis } = useWellness();

  // Voice State Machine: IDLE | LISTENING | PROCESSING | SPEAKING | ERROR
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('standard');
  const [transcript, setTranscript] = useState('');
  const [replyText, setReplyText] = useState(
    `Hello ${user?.display_name || 'Alex'}. I'm your calm voice companion. Press the microphone below and speak naturally whenever you're ready.`
  );
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [conversationId, setConversationId] = useState<string>(`conv-${user?.id || 'demo-user-123'}`);
  const [suggestedFollowups, setSuggestedFollowups] = useState<string[]>([
    "I'm feeling somewhat overwhelmed by exams",
    "Can you guide me through a 2-minute breathing exercise?",
    "How does my wearable data tie into my mood today?"
  ]);

  // Audio & Volume controls
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);

  // Refs
  const recognitionRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize Speech Recognition & Microphone Permissions
  useEffect(() => {
    // Check permission state if navigator permissions API available
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then((permissionObj) => {
          setPermissionStatus(permissionObj.state as any);
          permissionObj.onchange = () => setPermissionStatus(permissionObj.state as any);
        })
        .catch(() => {});
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setVoiceState('LISTENING');
        setVoiceError(null);
        setPermissionStatus('granted');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        // If finalized, proceed to processing
        if (event.results[0].isFinal) {
          recognition.stop();
          setVoiceState('PROCESSING');
          handleTurn(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        if (event.error === 'not-allowed') {
          setPermissionStatus('denied');
          setVoiceError('Microphone permission denied. Please allow microphone access or use the simulation queries below.');
          setVoiceState('ERROR');
        } else if (event.error === 'no-speech') {
          setVoiceState('IDLE');
        } else {
          setVoiceError(`Audio notice: ${event.error}. You can retry or use sample speech queries.`);
          setVoiceState('ERROR');
        }
      };

      recognition.onend = () => {
        setVoiceState((prev) => (prev === 'LISTENING' ? 'IDLE' : prev));
      };

      recognitionRef.current = recognition;
    } else {
      setVoiceError('Browser Web Speech API not natively supported on this browser. Voice simulation and REST audio mode is active.');
    }

    // Load initial conversation history from shared memory
    loadConversationHistory();

    return () => {
      stopAudio();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // WebSocket connection for Real-Time Streaming Mode
  useEffect(() => {
    if (voiceMode === 'realtime') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//127.0.0.1:8000/api/v1/voice/ws?conversation_id=${conversationId}`;

      try {
        const ws = new WebSocket(wsUrl);
        ws.onopen = () => {
          console.log('Real-Time Voice WebSocket connected.');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'processing_start') {
              setVoiceState('PROCESSING');
            } else if (data.type === 'transcription') {
              setTranscript(data.text);
            } else if (data.type === 'response') {
              handleBotResponse(data);
            } else if (data.type === 'interrupted') {
              stopAudio();
              setVoiceState('IDLE');
            } else if (data.type === 'error') {
              setVoiceError(data.message || 'Real-time connection error.');
              setVoiceState('ERROR');
            }
          } catch (e) {
            console.error('Error parsing WS message:', e);
          }
        };

        ws.onerror = (err) => {
          console.warn('WebSocket voice error, falling back to Standard Voice:', err);
          setVoiceMode('standard');
        };

        ws.onclose = () => {
          console.log('WebSocket voice channel closed.');
        };

        wsRef.current = ws;
      } catch (err) {
        console.warn('WebSocket initiation failed:', err);
        setVoiceMode('standard');
      }
    } else {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    }
  }, [voiceMode, conversationId]);

  // Load shared conversation history
  const loadConversationHistory = async () => {
    try {
      const historyList = await api.getChatHistory();
      if (historyList && historyList.length > 0) {
        const active = historyList[0];
        setConversationId(active.id);
        setConversationHistory(active.messages || []);
      }
    } catch (e) {
      console.warn('Could not load shared conversation history:', e);
    }
  };

  // Audio Playback & Voice Persona Synthesis
  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current = null;
    }
    setVoiceState('IDLE');
  };

  const playSynthesizedSpeech = (text: string, audioBase64?: string) => {
    stopAudio();

    if (isMuted) return;

    // 1. If server returned audio bytes (WAV payload), play via HTML5 Audio element
    if (audioBase64) {
      try {
        const audio = new Audio(audioBase64);
        audio.volume = volume;
        audioPlayerRef.current = audio;

        audio.onplay = () => setVoiceState('SPEAKING');
        audio.onended = () => setVoiceState('IDLE');
        audio.onerror = () => {
          console.warn('Audio element error, falling back to Web Speech Synthesis.');
          fallbackSpeechSynthesis(text);
        };

        audio.play().catch(() => {
          fallbackSpeechSynthesis(text);
        });
        return;
      } catch (e) {
        console.warn('Audio playback exception:', e);
      }
    }

    // 2. Fallback to calibrated calm browser SpeechSynthesis
    fallbackSpeechSynthesis(text);
  };

  const fallbackSpeechSynthesis = (text: string) => {
    if (!('speechSynthesis' in window) || isMuted) {
      setVoiceState('IDLE');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // MindCare Voice Persona: Calm, warm, mature, reassuring, soft-spoken, patient
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.volume = volume;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.name.includes('Natural') ||
        v.name.includes('Samantha') ||
        v.name.includes('Google US English') ||
        v.name.includes('Jenny') ||
        v.name.includes('Serena')
    );
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setVoiceState('SPEAKING');
    utterance.onend = () => setVoiceState('IDLE');
    utterance.onerror = () => setVoiceState('IDLE');

    window.speechSynthesis.speak(utterance);
  };

  // Turn Handling (Standard & Real-Time)
  const handleTurn = async (spokenText: string) => {
    if (!spokenText.trim()) {
      setVoiceState('IDLE');
      return;
    }

    setVoiceError(null);
    setVoiceState('PROCESSING');

    // Real-Time Mode WebSocket dispatch
    if (voiceMode === 'realtime' && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'turn',
          text: spokenText,
          conversation_id: conversationId,
          mode: currentMode,
        })
      );
      return;
    }

    // Standard Mode REST Turn
    try {
      const res = await api.executeVoiceTurn({
        user_speech_text: spokenText,
        conversation_id: conversationId,
        current_mode: currentMode,
      });
      handleBotResponse(res);
    } catch (err: any) {
      console.error('Voice turn execution error:', err);
      setVoiceError('Connection hiccup occurred while processing your voice turn. Please try again.');
      setVoiceState('ERROR');
    }
  };

  const handleBotResponse = (res: any) => {
    if (res.conversation_id) {
      setConversationId(res.conversation_id);
    }

    // Crisis Safety Interception Gate
    if (res.safety_interception) {
      triggerCrisis({
        risk_level: 'CRITICAL',
        category: 'crisis_voice_detected',
        title: 'Immediate Crisis Support Available',
        message: res.reply_text,
        resources: [
          { name: '988 Suicide & Crisis Lifeline', phone: '988' },
          { name: 'Crisis Text Line', sms: 'Text HOME to 741741' },
        ],
        disclaimer: 'MindCare AI does not provide emergency medical diagnosis or intervention.',
      });
    }

    setReplyText(res.reply_text);
    if (res.suggested_followups && res.suggested_followups.length > 0) {
      setSuggestedFollowups(res.suggested_followups);
    }

    // Play response
    playSynthesizedSpeech(res.reply_text, res.audio_base64);

    // Refresh history
    loadConversationHistory();
  };

  // Central Microphone Toggle & Barge-in
  const toggleMicrophone = () => {
    // Interruption / Barge-in: If assistant is speaking, tap stops speech and starts listening
    if (voiceState === 'SPEAKING') {
      stopAudio();
      if (voiceMode === 'realtime' && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'interrupt' }));
      }
    }

    if (voiceState === 'LISTENING') {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setVoiceState('IDLE');
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Recognition start exception:', e);
          setVoiceState('IDLE');
        }
      } else {
        // Fallback simulation query
        const demoQueries = [
          "I'm feeling quite exhausted after today's lectures.",
          "I'm worried about my upcoming exams and cannot focus.",
          "I just finished a workout and my energy feels clearer.",
          "Can you suggest a calm breathing exercise to help me relax?"
        ];
        const randomQ = demoQueries[Math.floor(Math.random() * demoQueries.length)];
        setTranscript(randomQ);
        handleTurn(randomQ);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <DisclaimerBanner compact />

      {/* Main Voice Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs text-center flex flex-col items-center relative overflow-hidden">
        {/* Top Control Bar: Mode Toggle, Status, Privacy */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pb-6 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold border border-purple-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Context-Aware Voice Companion</span>
            </span>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200">
              {currentMode} Mode
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setVoiceMode('standard')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  voiceMode === 'standard' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Standard Mode
              </button>
              <button
                onClick={() => setVoiceMode('realtime')}
                className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center space-x-1 ${
                  voiceMode === 'realtime' ? 'bg-white text-purple-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Radio className="w-3 h-3 text-purple-600 animate-pulse" />
                <span>Real-Time Stream</span>
              </button>
            </div>

            {/* Conversation History Drawer Button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 flex items-center space-x-1 transition-colors"
              title="View shared conversation memory"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline font-semibold">History</span>
            </button>
          </div>
        </div>

        {/* Central Visualizer Sphere & Microphone Control */}
        <div className="relative w-56 h-56 flex items-center justify-center my-6">
          {/* Animated Waveform Outer Halo */}
          <div
            className={`absolute w-52 h-52 rounded-full transition-all duration-700 ${
              voiceState === 'SPEAKING'
                ? 'scale-125 opacity-70 bg-purple-200 animate-ping'
                : voiceState === 'LISTENING'
                ? 'scale-110 opacity-80 bg-red-100 animate-pulse'
                : voiceState === 'PROCESSING'
                ? 'scale-105 opacity-60 bg-indigo-100 animate-spin'
                : 'scale-90 opacity-30 bg-slate-100'
            }`}
          />
          <div
            className={`absolute w-40 h-40 rounded-full transition-all duration-300 ${
              voiceState === 'SPEAKING'
                ? 'scale-110 bg-purple-200/90'
                : voiceState === 'LISTENING'
                ? 'scale-105 bg-red-200/70'
                : 'bg-purple-100/50'
            }`}
          />

          {/* Central Action Button */}
          <button
            onClick={toggleMicrophone}
            className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center shadow-lg transition-transform transform active:scale-95 ${
              voiceState === 'LISTENING'
                ? 'bg-red-500 text-white animate-pulse'
                : voiceState === 'SPEAKING'
                ? 'bg-purple-700 text-white hover:bg-purple-800'
                : voiceState === 'PROCESSING'
                ? 'bg-indigo-600 text-white opacity-90'
                : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white hover:opacity-95'
            }`}
            title={
              voiceState === 'LISTENING'
                ? 'Tap to stop listening'
                : voiceState === 'SPEAKING'
                ? 'Tap to interrupt'
                : 'Tap to speak'
            }
          >
            {voiceState === 'LISTENING' ? (
              <MicOff className="w-10 h-10 animate-bounce" />
            ) : voiceState === 'SPEAKING' ? (
              <Square className="w-9 h-9 fill-white" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </button>
        </div>

        {/* State Label & Guidance */}
        <div className="space-y-1">
          <p className="text-base font-bold text-slate-800">
            {voiceState === 'IDLE' && 'Tap to talk'}
            {voiceState === 'LISTENING' && 'Listening to your voice...'}
            {voiceState === 'PROCESSING' && 'Thinking & synthesizing context...'}
            {voiceState === 'SPEAKING' && 'MindCare is speaking... (tap to interrupt)'}
            {voiceState === 'ERROR' && 'Voice service notice'}
          </p>
          <p className="text-xs text-slate-400">
            Persona: Calm, warm, mature, reassuring, soft-spoken, patient
          </p>
        </div>

        {/* Audio Toolbar: Stop, Replay, Volume Slider */}
        <div className="mt-5 flex items-center justify-center space-x-4 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-200/60 text-xs">
          {voiceState === 'SPEAKING' ? (
            <button
              onClick={stopAudio}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-red-700" />
              <span>Stop Speaking</span>
            </button>
          ) : (
            <button
              onClick={() => playSynthesizedSpeech(replyText)}
              disabled={voiceState === 'PROCESSING'}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
              <span>Replay Audio</span>
            </button>
          )}

          <div className="h-4 w-px bg-slate-200" />

          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-slate-500 hover:text-slate-800"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-20 accent-purple-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Error Alert Box */}
        {voiceError && (
          <div className="mt-4 w-full max-w-lg p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-2.5 text-left text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{voiceError}</p>
              <button
                onClick={() => setVoiceError(null)}
                className="mt-1 text-[11px] text-amber-700 underline font-semibold"
              >
                Dismiss notice
              </button>
            </div>
          </div>
        )}

        {/* User Speech Transcription Display */}
        {transcript && (
          <div className="mt-6 w-full max-w-lg bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">You Spoke</p>
            <p className="text-xs text-slate-800 italic font-medium leading-relaxed">"{transcript}"</p>
          </div>
        )}

        {/* Assistant Reply Card */}
        <div className="mt-4 w-full max-w-lg bg-purple-50/50 p-5 rounded-2xl border border-purple-100 text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-purple-900">MindCare Voice Response</span>
            </div>
            {voiceState === 'SPEAKING' && (
              <span className="flex items-center space-x-1 text-[10px] text-purple-700 font-semibold bg-purple-100 px-2 py-0.5 rounded-full">
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                <span>Audio Playing</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-800 leading-relaxed font-normal">{replyText}</p>
        </div>

        {/* Dynamic Suggested Follow-ups */}
        {suggestedFollowups.length > 0 && (
          <div className="mt-6 w-full max-w-lg text-left">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Conversational Follow-up Suggestions
            </p>
            <div className="flex flex-col gap-1.5">
              {suggestedFollowups.map((f, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setTranscript(f);
                    handleTurn(f);
                  }}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-purple-50 border border-slate-200/80 hover:border-purple-200 text-left text-xs text-slate-700 rounded-xl transition-colors font-medium flex items-center justify-between"
                >
                  <span>"{f}"</span>
                  <span className="text-[10px] text-purple-600 font-bold ml-2">Speak turn &rarr;</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Shared Conversation History Drawer (Collapsible) */}
        {showHistory && (
          <div className="mt-8 w-full max-w-lg border-t border-slate-100 pt-6 text-left">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                <span>Unified Conversation Memory (Shared Across Text & Voice)</span>
              </h4>
              <span className="text-[10px] font-mono text-slate-400">{conversationId}</span>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              {conversationHistory.length === 0 ? (
                <p className="text-slate-400 italic">No previous messages in this session.</p>
              ) : (
                conversationHistory.slice(-8).map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl ${
                      m.role === 'user'
                        ? 'bg-purple-100/70 text-purple-900 ml-6'
                        : 'bg-white text-slate-800 mr-6 border border-slate-200/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span className="font-bold uppercase">{m.role}</span>
                      <span className="font-mono">{m.metadata?.modality || 'dialogue'}</span>
                    </div>
                    <p className="text-xs">{m.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Thesis Demonstration Quick Speech Simulator */}
        <div className="mt-8 pt-6 border-t border-slate-100 w-full text-center">
          <p className="text-xs font-semibold text-slate-500 mb-3">
            Thesis Evaluation: Quick Test Queries (Zero hardware required):
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "I am stressed about my job interview tomorrow",
              "I haven't had enough time to prepare",
              "Can you suggest a calm breathing exercise?",
              "I just finished a workout and feel energized"
            ].map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTranscript(q);
                  handleTurn(q);
                }}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 transition-colors"
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>

        {/* Privacy Notice Banner */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center space-x-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Privacy Guaranteed: Spoken audio is analyzed ephemerally and never permanently stored.</span>
        </div>
      </div>
    </div>
  );
};
