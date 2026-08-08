import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../data/translations';

// ─── Model feature requirements (mirrors backend assessment.py::MODEL_REQUIRED_FIELDS) ───
const MODEL_REQUIRED_FIELDS: Record<string, string[]> = {
  heart:    ['age', 'gender', 'height', 'weight', 'bp', 'glucose', 'heartRate', 'exerciseFrequency', 'smoking', 'familyHistory', 'stressLevel'],
  diabetes: ['age', 'gender', 'glucose', 'bp', 'weight', 'height', 'familyHistory'],
  sleep:    ['age', 'gender', 'sleepDuration', 'stressLevel', 'heartRate', 'dailySteps', 'bp', 'exerciseFrequency', 'weight', 'height'],
  full:     ['age', 'gender', 'height', 'weight', 'bp', 'glucose', 'heartRate', 'sleepDuration', 'stressLevel', 'dailySteps', 'exerciseFrequency', 'smoking', 'alcohol', 'familyHistory'],
};

// Supported languages for the in-assessment language selector
const ASSESSMENT_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
];
import {
  Mic,
  MicOff,
  UploadCloud,
  Volume2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  FileText,
  Activity,
  User,
  Heart,
  Sliders
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  extracted?: Record<string, any>;
}

export const AIHealthAssessment: React.FC = () => {
  const { language: globalLanguage, username, healthData, setHealthData } = useApp();
  const t = translations[globalLanguage] || translations.en;

  // Local language override — assessment can run in a different language than the app UI
  const [assessmentLang, setAssessmentLang] = useState<string>(globalLanguage);

  // Options: 'voice' (default) | 'upload'
  const [mode, setMode] = useState<'voice' | 'upload'>('voice');
  const [selectedModel, setSelectedModel] = useState<'heart' | 'diabetes' | 'sleep' | 'full'>('full');
  
  // Audio state
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // Chat conversation state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [collectedData, setCollectedData] = useState<Record<string, any>>({});
  const [missingFields, setMissingFields] = useState<string[]>([]);
  
  // Manual text entry in chat
  const [textInput, setTextInput] = useState('');
  
  // Medical report states
  const [uploading, setUploading] = useState(false);
  const [extractedReportData, setExtractedReportData] = useState<Record<string, any>>({});
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [verificationMode, setVerificationMode] = useState(false);

  // Prediction output states
  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [syncedToProfile, setSyncedToProfile] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat window
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-start voice chat session on component mount
  useEffect(() => {
    if (!sessionId && mode === 'voice') {
      startSession('voice', selectedModel);
    }
  }, []);

  // TTS helper — uses the local assessment language
  const speakLocal = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const langMap: Record<string, string> = {
        hi: 'hi-IN', kn: 'kn-IN', te: 'te-IN', ta: 'ta-IN', ml: 'ml-IN', bn: 'bn-IN', mr: 'mr-IN'
      };
      utterance.lang = langMap[assessmentLang] || 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handlePlayVoice = (base64Audio: string, fallbackText: string) => {
    if (base64Audio) {
      try {
        const audioSrc = `data:audio/wav;base64,${base64Audio}`;
        const audio = new Audio(audioSrc);
        audio.play().catch(e => {
          console.warn("Audio element play prevented, falling back to speech synthesis:", e);
          speakLocal(fallbackText);
        });
      } catch (err) {
        console.error("Playback error:", err);
        speakLocal(fallbackText);
      }
    } else {
      speakLocal(fallbackText);
    }
  };

  // 1. SESSION MANAGEMENT
  const startSession = async (targetMode: 'upload' | 'voice', targetModelName: 'heart' | 'diabetes' | 'sleep' | 'full') => {
    try {
      const response = await fetch('/api/assessment/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username || 'guest',
          language: assessmentLang,
          model: targetModelName
        })
      });
      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id);
        setCollectedData(data.known_features || {});
        setMissingFields(data.missing_features || []);

        if (targetMode === 'voice') {
          const greetings: Record<string, string> = {
            kn: 'ನಮಸ್ಕಾರ. ನಿಮ್ಮ ಆರೋಗ್ಯ ವಿವರ ಮೌಲ್ಯಮಾಪನ ಪ್ರಾರಂಭಿಸೋಣ. ಮೊದಲನೆಯದಾಗಿ, ನಿಮ್ಮ ವಯಸ್ಸು ಎಷ್ಟು?',
            hi: 'नमस्ते। आइए आपका स्वास्थ्य मूल्यांकन शुरू करें। सबसे पहले, आपकी आयु क्या है?',
            ta: 'வணக்கம். உங்கள் உடல்நல மதிப்பீடு தொடங்குவோம். முதலில், உங்கள் வயது என்ன?',
            te: 'నమస్కారం. మీ ఆరోగ్య మదింపు ప్రారంభిద్దాం. మొదట, మీ వயసు ఎంత?',
          };
          const initMsg = greetings[assessmentLang] || "Hello. Let's begin your health risk assessment. First, what is your age?";

          setMessages([{ sender: 'assistant', text: initMsg }]);
          setCurrentQuestion(data.current_question);
          speakLocal(initMsg);
        }
        setMode(targetMode);
      }
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  // Helper to pick supported audio codec for MediaRecorder
  const getSupportedMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
      'audio/wav'
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
  };

  // 2. VOICE CAPTURE & RECORDING
  const startRecording = async () => {
    setAudioChunks([]);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      
      const localChunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          localChunks.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(localChunks, { type: mimeType || 'audio/webm' });
        await handleUploadAudio(audioBlob);
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Microphone permission was denied or microphone was not detected. You can also type your answers using the text box below.");
    }
  };e);
      }
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  // 2. VOICE CAPTURE & RECORDING
  const startRecording = async () => {
    setAudioChunks([]);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      const localChunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          localChunks.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(localChunks, { type: 'audio/webm' });
        await handleUploadAudio(audioBlob);
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Microphone permission was denied. Please check your browser privacy preferences.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
    }
  };

  const handleUploadAudio = async (audioBlob: Blob) => {
    if (!sessionId) return;
    setIsProcessingVoice(true);
    
    const formData = new FormData();
    formData.append("file", audioBlob, "voice_answer.webm");
    
    try {
      const response = await fetch(`/api/assessment/${sessionId}/voice`, {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        const data = await response.json();
        
        // Add user transcript
        setMessages(prev => [
          ...prev, 
          { sender: 'user', text: data.transcript, extracted: data.extracted_data }
        ]);
        
        // Update state
        setCollectedData(data.session.known_features || {});
        setMissingFields(data.session.missing_features || []);
        setCurrentQuestion(data.session.current_question || '');
        
        // Add assistant response
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            { sender: 'assistant', text: data.next_question }
          ]);
          handlePlayVoice(data.next_question_audio, data.next_question);
        }, 600);
      }
    } catch (err) {
      console.error("Voice process failed:", err);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // 3. TEXT ANSWER SUBMISSION
  const handleSendText = async () => {
    if (!textInput.trim() || !sessionId) return;
    const textToSend = textInput;
    setTextInput('');
    
    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    
    try {
      const response = await fetch(`/api/assessment/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSend })
      });
      if (response.ok) {
        const data = await response.json();
        
        // Add user extraction visual feedback
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].extracted = data.extracted_data;
          return updated;
        });

        setCollectedData(data.session.known_features || {});
        setMissingFields(data.session.missing_features || []);
        setCurrentQuestion(data.session.current_question || '');

        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            { sender: 'assistant', text: data.next_question }
          ]);
          handlePlayVoice(data.next_question_audio, data.next_question);
        }, 500);
      }
    } catch (err) {
      console.error("Answer submission failed:", err);
    }
  };

  // Skip current question parameter
  const handleSkipQuestion = async () => {
    if (!sessionId || !currentQuestion) return;
    
    const skipLabel = assessmentLang === 'kn' ? "ಸ್ಕಿಪ್" : assessmentLang === 'hi' ? "छोड़ें" : "Skip parameter";
    setMessages(prev => [...prev, { sender: 'user', text: skipLabel }]);
    
    try {
      const response = await fetch(`/api/assessment/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: "skip" })
      });
      if (response.ok) {
        const data = await response.json();
        setCollectedData(data.session.known_features || {});
        setMissingFields(data.session.missing_features || []);
        setCurrentQuestion(data.session.current_question || '');

        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            { sender: 'assistant', text: data.next_question }
          ]);
          handlePlayVoice(data.next_question_audio, data.next_question);
        }, 500);
      }
    } catch (err) {
      console.error("Skip action failed:", err);
    }
  };

  // 4. REPORT UPLOAD HANDLING
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !sessionId) return;
    
    setUploading(true);
    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await fetch(`/api/assessment/${sessionId}/upload-report`, {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        const data = await response.json();
        setExtractedReportData(data.extracted_data || {});
        setEditData(data.session.known_features || {});
        setCollectedData(data.session.known_features || {});
        setMissingFields(data.session.missing_features || []);
        setVerificationMode(true);
      }
    } catch (err) {
      console.error("Report extraction failed:", err);
    } finally {
      setUploading(false);
    }
  };

  // 5. RUN RISK ANALYSIS (INFERENCE + SHAP EXPLAINABILITY)
  const handleRunAnalysis = async (finalDataset: Record<string, any>) => {
    if (!sessionId) return;
    setIsAnalyzing(true);
    
    try {
      const response = await fetch(`/api/assessment/${sessionId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ override_data: finalDataset })
      });
      if (response.ok) {
        const data = await response.json();
        setAssessmentResult(data);
        
        // Voice response summarizing outcome
        const score = data.scores.heartRisk ?? data.scores.diabetesRisk ?? data.scores.sleepScore ?? 0;
        const voiceOutcome = assessmentLang === 'kn'
          ? `ಮೌಲ್ಯಮಾಪನ ಪೂರ್ಣಗೊಂಡಿದೆ. ನಿಮ್ಮ ಅಪಾಯದ ಪ್ರಮಾಣ ಶೇಕಡಾ ${score} ರಷ್ಟಿದೆ. ದಯವಿಟ್ಟು ನೆನಪಿಡಿ, ಇದು ರೋಗನಿರ್ಣಯವಲ್ಲ.`
          : assessmentLang === 'hi'
          ? `मूल्यांकन पूरा हो गया है। आपका अनुमानित जोखिम स्तर ${score} प्रतिशत है। ध्यान दें, यह कोई निदान नहीं है।`
          : `Assessment finalized. The model estimates your risk score at ${score} percent. Remember, this is an advisory triage assessment, not a formal medical diagnosis.`;
          
        speakLocal(voiceOutcome);
      }
    } catch (err) {
      console.error("Assessment runtime execution failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Sync collected parameters to global AppContext health profile
  const handleSyncToProfile = () => {
    if (!assessmentResult?.data_used) return;
    const du = assessmentResult.data_used;
    setHealthData({
      ...healthData,
      age: du.age ?? healthData.age,
      gender: du.gender ?? healthData.gender,
      height: du.height ?? healthData.height,
      weight: du.weight ?? healthData.weight,
      bpSystolic: du.bpSystolic ?? healthData.bpSystolic,
      bpDiastolic: du.bpDiastolic ?? healthData.bpDiastolic,
      glucose: du.glucose ?? healthData.glucose,
      heartRate: du.heartRate ?? healthData.heartRate,
      sleepDuration: du.sleepDuration ?? healthData.sleepDuration,
      stressLevel: du.stressLevel ?? healthData.stressLevel,
      dailySteps: du.dailySteps ?? healthData.dailySteps,
      exerciseFrequency: du.exerciseFrequency ?? healthData.exerciseFrequency,
      smoking: du.smoking === 'yes' ? 'smoker' : du.smoking === 'no' ? 'non-smoker' : healthData.smoking,
      alcohol: du.alcohol ?? healthData.alcohol,
      familyHistory: du.familyHistory ?? healthData.familyHistory,
    });
    setSyncedToProfile(true);
    setTimeout(() => setSyncedToProfile(false), 4000);
  };

  const handleReset = () => {
    setMode('select');
    setSessionId(null);
    setMessages([]);
    setCurrentQuestion('');
    setCollectedData({});
    setMissingFields([]);
    setTextInput('');
    setExtractedReportData({});
    setEditData({});
    setVerificationMode(false);
    setAssessmentResult(null);
    setSyncedToProfile(false);
  };

  // Format SHAP data for chart visualization.
  const getSHAPChartData = () => {
    if (!assessmentResult?.shap || assessmentResult.shap.error) return [];

    const shap = assessmentResult.shap;

    if (shap.type === 'binary' && Array.isArray(shap.contributions)) {
      return shap.contributions.slice(0, 8).map((c: any) => ({
        name: String(c.feature).replace(/_/g, ' ').toUpperCase(),
        value: Number(Number(c.shap_value).toFixed(4)),
      }));
    }

    if (shap.type === 'multi_class' && Array.isArray(shap.shap_per_class)) {
      const cls = shap.shap_per_class[0] || [];
      return cls.slice(0, 8).map((c: any) => ({
        name: String(c.feature).replace(/_/g, ' ').toUpperCase(),
        value: Number(Number(c.shap_value).toFixed(4)),
      }));
    }

    return [];
  };

  const getPrimaryScore = (): number => {
    if (!assessmentResult?.scores) return 0;
    const s = assessmentResult.scores;
    if (selectedModel === 'diabetes') return s.diabetesRisk ?? 0;
    if (selectedModel === 'sleep')    return s.sleepScore ?? 0;
    return s.heartRisk ?? 0;
  };

  const shapData = getSHAPChartData();
  const primaryScore = getPrimaryScore();

  return (
    <div className="space-y-8 animate-fade-in text-foreground">

      {/* HEADER BANNER WITH TOP TAB NAVIGATION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-primary/10 via-fuchsia-500/5 to-transparent rounded-3xl border border-border/40 backdrop-blur-md shadow-xl">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center space-x-2">
            <Activity className="text-primary animate-pulse" size={24} />
            <span>{(t as any).assessmentTitle}</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Multilingual Voice-to-Metrics extraction & clinical report normalization. Runs completely offline.
          </p>
        </div>

        {/* Mode switcher tabs & Language selector */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          
          <div className="flex bg-secondary/60 p-1 rounded-2xl border border-border/50">
            <button
              onClick={() => {
                if (mode !== 'voice') {
                  startSession('voice', selectedModel);
                }
              }}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                mode === 'voice'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Mic size={14} />
              <span>🎤 Voice & AI Chat</span>
            </button>

            <button
              onClick={() => {
                if (mode !== 'upload') {
                  startSession('upload', 'full');
                }
              }}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                mode === 'upload'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UploadCloud size={14} />
              <span>📄 Upload Report</span>
            </button>
          </div>

          <div className="flex items-center space-x-1.5 bg-secondary/40 border border-border/50 px-2.5 py-1.5 rounded-xl text-xs">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              🌐
            </span>
            <select
              value={assessmentLang}
              onChange={(e) => setAssessmentLang(e.target.value)}
              className="bg-transparent text-xs font-semibold focus:outline-none text-foreground"
            >
              {ASSESSMENT_LANGUAGES.map(l => (
                <option key={l.code} value={l.code} className="bg-card text-foreground">{l.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-border/60 hover:bg-secondary/40 text-xs font-bold transition-all text-muted-foreground hover:text-foreground"
            title="Start fresh session"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* STAGE 2: UPLOAD MEDICAL REPORT WORKFLOW */}
      {mode === 'upload' && !verificationMode && (
        <div className="max-w-2xl mx-auto bg-card/40 border border-border/60 rounded-2xl p-10 flex flex-col items-center justify-center space-y-6 shadow-xl backdrop-blur-md">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <UploadCloud size={32} className="animate-bounce" />
          </div>
          <div className="text-center space-y-1">
            <h4 className="text-sm font-bold">Drop your clinical report file here</h4>
            <p className="text-xs text-muted-foreground">Supports PDF, CSV, TXT, and JPG/PNG medical printouts</p>
          </div>
          
          <label className="relative cursor-pointer bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl text-xs hover:bg-primary/95 transition-all shadow-md shadow-primary/10 active:scale-[0.98]">
            {uploading ? "Extracting Vitals..." : "Browse Local File"}
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.csv,.txt,.png,.jpg,.jpeg"
              disabled={uploading}
            />
          </label>
        </div>
      )}

      {/* STAGE 3: DATA VERIFICATION LAYERS (FOR MEDICAL REPORT) */}
      {mode === 'upload' && verificationMode && !assessmentResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Vitals Form Column */}
          <div className="lg:col-span-2 bg-card/40 border border-border/60 rounded-2xl p-6 space-y-6 shadow-xl backdrop-blur-md">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground flex items-center space-x-1.5">
                <CheckCircle2 className="text-emerald-400" size={16} />
                <span>Verify Extracted Medical Parameters</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Please check the extracted metrics below. Update any values that look inaccurate or fill in missing fields.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.keys(editData).length === 0 ? (
                <div className="text-xs text-muted-foreground col-span-2">No parameters extracted yet. Please enter values below manually.</div>
              ) : (
                Object.keys(editData).map((key) => {
                  const val = editData[key];
                  const label = t[key as keyof typeof t] || key;
                  return (
                    <div key={key} className="flex flex-col space-y-1 bg-secondary/20 p-3 rounded-xl border border-border/40">
                      <span className="text-[10px] font-bold text-muted-foreground capitalize">{label}</span>
                      <input
                        type={typeof val === 'number' ? 'number' : 'text'}
                        value={val || ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setEditData(prev => ({
                            ...prev,
                            [key]: typeof val === 'number' ? Number(v) : v
                          }));
                        }}
                        className="bg-transparent text-sm font-bold border-none focus:outline-none focus:ring-0 text-foreground w-full mt-1 font-mono"
                      />
                      {extractedReportData[key] === undefined && (
                        <span className="text-[9px] text-amber-400 font-semibold mt-1">⚠ User Input Required (Not in Report)</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="flex justify-end pt-4">
              <button
                onClick={() => handleRunAnalysis(editData)}
                disabled={isAnalyzing}
                className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl text-xs hover:bg-primary/95 transition-all shadow-md flex items-center space-x-1.5"
              >
                {isAnalyzing ? "Processing Prediction..." : "Analyze Health & Attributions"}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
          
          {/* Missing Parameters Audit Column */}
          <div className="bg-card/30 border border-border/50 rounded-2xl p-6 space-y-6">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Parameter Audit Dashboard</h4>
            <div className="space-y-3">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 block uppercase tracking-widest">Identified Parameters</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Object.keys(editData).map(k => (
                    <span key={k} className="text-[10px] bg-emerald-500/20 border border-emerald-500/25 px-2 py-0.5 rounded-full font-mono capitalize">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
              
              {missingFields.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-amber-400 block uppercase tracking-widest">Missing Risk Factors</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {missingFields.map(k => (
                      <span key={k} className="text-[10px] bg-amber-500/20 border border-amber-500/25 px-2 py-0.5 rounded-full font-mono capitalize">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STAGE 4: VOICE ASSESSMENT INTERACTIVE MODE */}
      {mode === 'voice' && !assessmentResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Voice Chat Column */}
          <div className="lg:col-span-2 bg-card/45 backdrop-blur-md border border-border/60 rounded-2xl p-6 flex flex-col h-[520px] justify-between shadow-xl">
            
            {/* Active Question Title */}
            <div className="border-b border-border/30 pb-3 flex justify-between items-center">
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 flex items-center space-x-1.5">
                <Volume2 size={14} className="animate-pulse" />
                <span>{(t as any).voiceMode}</span>
              </span>
              
              <div className="flex items-center space-x-2 text-[10px] font-mono text-muted-foreground uppercase">
                <span>Model Focus:</span>
                <span className="bg-indigo-500/20 border border-indigo-500/25 px-2 py-0.5 rounded-full text-indigo-400 font-bold">{selectedModel}</span>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 my-2 scrollbar-thin">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-4 text-xs shadow-md border ${
                    msg.sender === 'user'
                      ? 'bg-indigo-500 border-indigo-600 text-white rounded-tr-none'
                      : 'bg-secondary/45 border-border/80 text-foreground rounded-tl-none'
                  }`}>
                    <p className="leading-relaxed font-semibold">{msg.text}</p>
                    
                    {/* Visual Parameter Attributions */}
                    {msg.extracted && Object.keys(msg.extracted).length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-indigo-600/30 flex items-center space-x-1.5">
                        <CheckCircle2 size={12} className="text-emerald-300" />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-200">
                          Extracted: {JSON.stringify(msg.extracted)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Voice Capture Box */}
            <div className="border-t border-border/30 pt-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                
                {/* Visual Audio Wave */}
                <div className="flex-1 flex items-center justify-center space-x-1">
                  {recording ? (
                    <>
                      <span className="w-1 bg-indigo-500 h-6 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-1 bg-indigo-500 h-8 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                      <span className="w-1 bg-indigo-500 h-10 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
                      <span className="w-1 bg-indigo-500 h-8 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <span className="w-1 bg-indigo-500 h-6 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      <span className="text-[10px] text-indigo-400 font-bold uppercase pl-2 font-mono">{(t as any).listening}</span>
                    </>
                  ) : isProcessingVoice ? (
                    <span className="text-[10px] text-muted-foreground animate-pulse font-bold uppercase font-mono">{(t as any).processing}</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground font-mono uppercase">Click microphone and speak parameter value</span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={recording ? stopRecording : startRecording}
                    disabled={isProcessingVoice}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      recording 
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                        : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    }`}
                  >
                    {recording ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                  
                  {currentQuestion && (
                    <button
                      onClick={handleSkipQuestion}
                      disabled={isProcessingVoice || recording}
                      className="px-3.5 py-2.5 rounded-xl border border-border hover:bg-secondary/40 text-[10px] font-bold tracking-widest uppercase transition-all"
                    >
                      {(t as any).skipQ}
                    </button>
                  )}
                </div>

              </div>
              
              {/* Text Backup Box */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                  placeholder="Or type your health parameter answer here..."
                  className="flex-1 bg-secondary/40 border border-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSendText}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-4 rounded-xl font-bold"
                >
                  Send
                </button>
              </div>
            </div>

          </div>
          
          {/* Collected Information Side List */}
          <div className="bg-card/45 backdrop-blur-md border border-border/60 rounded-2xl p-6 flex flex-col justify-between h-[520px] shadow-xl">
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">{(t as any).collectedInfo}</h4>
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-2 scrollbar-thin">
                {MODEL_REQUIRED_FIELDS[selectedModel].map(field => {
                  let fe_key = field;
                  let displayVal = "";
                  if (field === "bp") {
                    if (collectedData["bpSystolic"] && collectedData["bpDiastolic"]) {
                      displayVal = `${collectedData["bpSystolic"]}/${collectedData["bpDiastolic"]} mmHg`;
                    }
                  } else if (collectedData[fe_key] !== undefined) {
                    displayVal = String(collectedData[fe_key]);
                  }
                  
                  const isKnown = displayVal !== "";
                  const label = t[fe_key as keyof typeof t] || field;

                  return (
                    <div key={field} className="flex justify-between items-center p-2.5 rounded-xl bg-secondary/25 border border-border/40 text-xs">
                      <span className="capitalize font-semibold text-muted-foreground pr-2 truncate max-w-[130px]" title={label}>{label}</span>
                      {isKnown ? (
                        <div className="flex items-center space-x-1">
                          <span className="font-mono font-bold text-foreground">{displayVal}</span>
                          <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted/30 italic">Not Captured</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <button
              onClick={() => handleRunAnalysis(collectedData)}
              disabled={isAnalyzing || Object.keys(collectedData).length === 0}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl text-xs transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center space-x-1"
            >
              <Sparkles size={14} />
              <span>{(t as any).analyzeHealth}</span>
            </button>
          </div>
        </div>
      )}

      {/* STAGE 5: RISK SUMMARY & EXPLAINABLE REPORT DASHBOARD */}
      {assessmentResult && (
        <div className="space-y-8 animate-scale-up">
          
          {/* Main Risk Display Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Risk Badge — uses model-specific primaryScore */}
            <div className="bg-card/45 backdrop-blur-md border border-border/60 rounded-2xl p-6 flex flex-col justify-between items-center text-center shadow-lg hover:border-border transition-all">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{(t as any).estimatedRisk}</p>

              <div className="my-6 space-y-2">
                <span className={`text-2xl font-black px-6 py-2.5 rounded-full border shadow-md inline-block uppercase tracking-wider ${
                  primaryScore > 60
                    ? 'text-red-400 bg-red-500/10 border-red-500/25 shadow-red-500/5'
                    : primaryScore > 35
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/25 shadow-amber-500/5'
                    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25 shadow-emerald-500/5'
                }`}>
                  {primaryScore > 60 ? 'High Risk' : primaryScore > 35 ? 'Moderate Risk' : 'Low Risk'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button
                  onClick={() => {
                    const voiceTexts: Record<string, string> = {
                      kn: `ನಿಮ್ಮ ಅಪಾಯದ ಪ್ರಮಾಣ ಶೇಕಡಾ ${primaryScore} ರಷ್ಟಿದೆ. ನಿಮ್ಮ ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ. ಇದು ವೈದ್ಯಕೀಯ ರೋಗ ನಿರ್ಣಯವಲ್ಲ.`,
                      hi: `आपका अनुमानित जोखिम स्तर ${primaryScore} प्रतिशत है। यह कोई चिकित्सा निदान नहीं है।`,
                    };
                    const outcomeText = voiceTexts[assessmentLang]
                      || `The model estimates your risk score at ${primaryScore} percent. This is an advisory assessment, not a medical diagnosis.`;
                    speakLocal(outcomeText);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-secondary/50 border border-border hover:bg-secondary rounded-lg text-[10px] font-bold uppercase transition-all"
                >
                  <Volume2 size={12} />
                  <span>{(t as any).hearResult}</span>
                </button>

                <button
                  onClick={handleSyncToProfile}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                    syncedToProfile
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                  }`}
                >
                  <User size={12} />
                  <span>{syncedToProfile ? 'Synced ✓' : 'Sync Profile'}</span>
                </button>
              </div>
            </div>

            {/* Probability Slider — model-specific score */}
            <div className="bg-card/45 backdrop-blur-md border border-border/60 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{(t as any).riskProb}</p>
                <TrendingUp size={16} className="text-primary" />
              </div>

              <div className="my-4 space-y-1">
                <h3 className="text-4xl font-black font-mono tracking-tighter text-gradient">{primaryScore}%</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  {selectedModel === 'sleep' ? 'Sleep Health Score' : 'XGBoost Risk Probability'}
                </p>
              </div>

              <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-red-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${primaryScore}%` }}
                />
              </div>
            </div>

            {/* Comprehensive Vitals Map Card (Displays ALL collected health details) */}
            <div className="bg-card/45 backdrop-blur-md border border-border/60 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                  <span>Parameter Vitals Map</span>
                  <span className="text-[10px] font-normal text-emerald-400">{Object.keys(assessmentResult.data_used || {}).length} Captured</span>
                </h4>
                
                <div className="grid grid-cols-2 gap-2 mt-3 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                  {Object.entries(assessmentResult.data_used || {}).map(([key, val]) => {
                    if (val === null || val === undefined) return null;
                    const label = t[key as keyof typeof t] || key;
                    const formattedVal = typeof val === 'number' ? val : String(val);
                    return (
                      <div key={key} className="bg-secondary/30 p-2 rounded-xl border border-border/40 flex flex-col">
                        <span className="text-[9px] text-muted-foreground uppercase truncate" title={String(label)}>{label}</span>
                        <span className="text-xs font-bold font-mono text-foreground capitalize truncate">{formattedVal}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* Explainable Attributions (SHAP attributions visualization) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 bg-card/45 backdrop-blur-md border border-border/60 rounded-2xl p-6 space-y-6 shadow-xl">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground flex items-center space-x-1.5">
                  <Sliders className="text-primary" size={16} />
                  <span>{(t as any).shapAttribution}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  XGBoost Shapley contribution values indicating biometric parameters driving risk increases or protective effects.
                </p>
              </div>

              {shapData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={shapData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={9} />
                      <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.4)" fontSize={9} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(20,20,30,0.9)',
                          borderColor: 'rgba(255,255,255,0.1)',
                          borderRadius: '12px'
                        }}
                        labelClassName="font-extrabold text-white text-[10px]"
                      />
                      <Bar dataKey="value" fill="#6366f1">
                        {shapData.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.value > 0 ? 'rgb(239, 68, 68)' : 'rgb(16, 185, 129)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground border border-dashed border-border p-6 rounded-xl text-center">
                  SHAP attributions currently unavailable. Ensure model files are trained and loaded.
                </div>
              )}
            </div>

            {/* Contributors List */}
            <div className="bg-card/45 backdrop-blur-md border border-border/60 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground flex items-center space-x-1.5">
                  <Heart className="text-red-400" size={14} />
                  <span>{(t as any).contrFactors}</span>
                </h4>
                <div className="space-y-2">
                  {shapData.slice(0, 4).map((entry: any) => {
                    const isRisk = entry.value > 0;
                    return (
                      <div key={entry.name} className="flex justify-between items-center p-2.5 rounded-xl bg-secondary/25 border border-border/40 text-xs">
                        <span className="font-semibold text-muted-foreground capitalize truncate max-w-[120px]">{entry.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                            isRisk ? 'text-red-400 bg-red-500/10' : 'text-emerald-400 bg-emerald-500/10'
                          }`}>
                            {isRisk ? 'Risk Driver' : 'Protective'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="bg-secondary/40 border border-border/60 p-3 rounded-xl flex items-start space-x-2 text-[10px] leading-relaxed text-muted-foreground shadow-sm">
                <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <span>
                  High attributions represent actionable parameters to adjust for improving counterfactual wellness indexes.
                </span>
              </div>
            </div>

          </div>

          {/* CLINICAL DISCLAIMER */}
          <div className="p-4 bg-amber-500/5 border border-amber-500/25 rounded-2xl flex items-start space-x-3 shadow-sm max-w-4xl mx-auto">
            <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Clinical Decision Notice</span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {(t as any).medicalDisclaimer}
              </p>
            </div>
          </div>
          
        </div>
      )}

    </div>
  );
};

