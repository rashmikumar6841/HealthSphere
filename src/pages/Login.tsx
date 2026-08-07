import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  BrainCircuit, Lock, Mail, Sparkles, Activity, ShieldCheck,
  User, ChevronRight, ChevronLeft, Heart, Moon, Cigarette,
  Droplets, Dumbbell, Eye, EyeOff, CheckCircle, ArrowRight,
  UserPlus, LogIn
} from 'lucide-react';

type Mode = 'login' | 'register';
type RegisterStep = 1 | 2 | 3;

export const Login: React.FC = () => {
  const { setSession } = useApp();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registerStep, setRegisterStep] = useState<RegisterStep>(1);

  // --- LOGIN STATE ---
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // --- REGISTER STATE ---
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');

  // Step 2: Personal
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  // Step 3: Clinical vitals
  const [bpSystolic, setBpSystolic] = useState('120');
  const [bpDiastolic, setBpDiastolic] = useState('80');
  const [glucose, setGlucose] = useState('90');
  const [heartRate, setHeartRate] = useState('72');
  const [sleepDuration, setSleepDuration] = useState('7');
  const [stressLevel, setStressLevel] = useState('4');
  const [dailySteps, setDailySteps] = useState('7000');
  const [exerciseFrequency, setExerciseFrequency] = useState('3');
  const [smoking, setSmoking] = useState<'smoker' | 'non-smoker'>('non-smoker');
  const [alcohol, setAlcohol] = useState<'none' | 'moderate' | 'high'>('none');
  const [familyHistory, setFamilyHistory] = useState<'yes' | 'no'>('no');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!loginUsername || !loginPassword) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || 'Invalid username or password.');
      } else {
        setSession(data.username, data.name);
        navigate('/');
      }
    } catch {
      setError('Could not reach the server. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterNext = () => {
    setError('');
    if (registerStep === 1) {
      if (!regUsername.trim() || !regPassword.trim() || !regName.trim()) {
        setError('All fields are required.');
        return;
      }
      if (regPassword.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }
    if (registerStep === 2) {
      if (!age || !height || !weight) {
        setError('Please fill in all personal details.');
        return;
      }
    }
    setRegisterStep((prev) => (prev + 1) as RegisterStep);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        username: regUsername,
        password: regPassword,
        name: regName,
        age: parseFloat(age),
        gender,
        height: parseFloat(height),
        weight: parseFloat(weight),
        bpSystolic: parseFloat(bpSystolic),
        bpDiastolic: parseFloat(bpDiastolic),
        glucose: parseFloat(glucose),
        heartRate: parseFloat(heartRate),
        sleepDuration: parseFloat(sleepDuration),
        stressLevel: parseFloat(stressLevel),
        dailySteps: parseFloat(dailySteps),
        exerciseFrequency: parseFloat(exerciseFrequency),
        smoking,
        alcohol,
        familyHistory,
      };
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || 'Registration failed. Please try again.');
        setRegisterStep(1);
      } else {
        setSession(data.username, data.name);
        navigate('/');
      }
    } catch {
      setError('Could not reach the server. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-secondary/35 border border-border/80 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground/60';
  const labelClass = 'text-xs font-semibold text-muted-foreground uppercase tracking-wider';

  const stepLabels = ['Account', 'Personal', 'Vitals'];

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 left-10 animate-bounce text-primary/30 hidden md:block">
        <Sparkles size={32} />
      </div>
      <div className="absolute bottom-12 right-20 animate-pulse text-indigo-500/20 hidden md:block">
        <BrainCircuit size={48} />
      </div>

      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center bg-card/30 backdrop-blur-xl border border-border/60 rounded-3xl p-6 md:p-10 shadow-2xl relative z-10">

        {/* Left Panel */}
        <div className="hidden md:flex flex-col space-y-6 justify-center pr-6 border-r border-border/30">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-tr from-primary to-fuchsia-500 rounded-2xl text-white shadow-xl shadow-primary/20">
              <BrainCircuit size={32} className="animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">VitalPredict</h2>
              <p className="text-xs font-mono tracking-widest text-muted-foreground uppercase font-bold">Health Decision Support Platform</p>
            </div>
          </div>

          <div className="relative p-6 bg-secondary/30 rounded-2xl border border-border/40 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">EXPLAINABLE AI CORE</span>
              <Activity size={18} className="text-primary animate-pulse" />
            </div>
            <svg className="w-full h-28 text-muted-foreground/30" viewBox="0 0 300 100">
              <line x1="0" y1="50" x2="300" y2="50" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
              <path
                d="M0,50 L80,50 L90,30 L100,70 L110,15 L120,85 L130,50 L180,50 L190,40 L195,60 L200,30 L205,80 L210,50 L300,50"
                fill="none" stroke="url(#ecgG)" strokeWidth="2.5"
              />
              <circle cx="110" cy="15" r="5" fill="rgb(168,85,247)" className="animate-ping" style={{ transformOrigin: '110px 15px' }} />
              <circle cx="110" cy="15" r="4" fill="rgb(168,85,247)" />
              <circle cx="200" cy="30" r="4" fill="rgb(236,72,153)" />
              <line x1="110" y1="15" x2="150" y2="25" stroke="rgba(168,85,247,0.4)" strokeWidth="1" />
              <line x1="200" y1="30" x2="150" y2="25" stroke="rgba(236,72,153,0.4)" strokeWidth="1" />
              <circle cx="150" cy="25" r="5" fill="rgb(59,130,246)" />
              <defs>
                <linearGradient id="ecgG" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(99,102,241)" />
                  <stop offset="50%" stopColor="rgb(168,85,247)" />
                  <stop offset="100%" stopColor="rgb(236,72,153)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="mt-3 space-y-1">
              <p className="text-sm font-semibold text-foreground">Explainable Clinical Decision Support</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Create your account to get personalized SHAP-attributed risk scores for heart disease and diabetes, powered by your real health data.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs text-muted-foreground px-1">
            <ShieldCheck className="text-emerald-500 shrink-0" size={16} />
            <span>Fully compliant with HIPAA and GDPR data privacy standards.</span>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col space-y-5">
          {/* Mobile logo */}
          <div className="md:hidden flex flex-col items-center space-y-2 mb-2">
            <div className="p-3 bg-gradient-to-tr from-primary to-fuchsia-500 rounded-xl text-white">
              <BrainCircuit size={28} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">VitalPredict</h2>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-secondary/40 rounded-xl p-1">
            <button
              id="btn-login-tab"
              type="button"
              onClick={() => { setMode('login'); setError(''); setRegisterStep(1); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'login' ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LogIn size={15} /> Sign In
            </button>
            <button
              id="btn-register-tab"
              type="button"
              onClick={() => { setMode('register'); setError(''); setRegisterStep(1); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'register' ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <UserPlus size={15} /> Create Account
            </button>
          </div>

          {/* === LOGIN FORM === */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight">Welcome Back</h3>
                <p className="text-xs text-muted-foreground">Sign in to access your health intelligence dashboard.</p>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass} htmlFor="login-username">Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground">
                    <User size={15} />
                  </span>
                  <input
                    id="login-username"
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className={`${inputClass} pl-10`}
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass} htmlFor="login-password">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground">
                    <Lock size={15} />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={`${inputClass} pl-10 pr-10`}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-medium">
                  {error}
                </div>
              )}

              <button
                id="btn-sign-in"
                type="submit"
                disabled={loading}
                className="w-full mt-1 bg-gradient-to-r from-primary to-fuchsia-600 hover:from-primary/90 hover:to-fuchsia-600/90 text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-lg shadow-primary/20 active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-70"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Authenticating...</span></>
                ) : (
                  <><span>Sign In</span><ArrowRight size={15} /></>
                )}
              </button>

              <p className="text-center text-xs text-muted-foreground pt-1">
                No account?{' '}
                <button type="button" onClick={() => { setMode('register'); setError(''); }} className="text-primary font-semibold hover:underline">
                  Create one for free
                </button>
              </p>
            </form>
          )}

          {/* === REGISTER FORM === */}
          {mode === 'register' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight">Create Your Account</h3>
                <p className="text-xs text-muted-foreground">Set up your personalized health monitoring profile.</p>
              </div>

              {/* Step Indicators */}
              <div className="flex items-center gap-1">
                {stepLabels.map((label, i) => {
                  const step = i + 1;
                  const isActive = registerStep === step;
                  const isDone = registerStep > step;
                  return (
                    <React.Fragment key={step}>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${isActive ? 'bg-primary text-primary-foreground' : isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-secondary/50 text-muted-foreground'}`}>
                        {isDone ? <CheckCircle size={11} /> : <span>{step}</span>}
                        <span>{label}</span>
                      </div>
                      {i < 2 && <div className={`flex-1 h-px ${registerStep > step ? 'bg-emerald-500/40' : 'bg-border/50'}`} />}
                    </React.Fragment>
                  );
                })}
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-medium">
                  {error}
                </div>
              )}

              {/* --- Step 1: Account Credentials --- */}
              {registerStep === 1 && (
                <div className="space-y-3 animate-fade-in">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Display Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground"><User size={15} /></span>
                      <input id="reg-name" type="text" value={regName} onChange={(e) => setRegName(e.target.value)} className={`${inputClass} pl-10`} placeholder="e.g. Alex Johnson" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Username</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground"><Mail size={15} /></span>
                      <input id="reg-username" type="text" value={regUsername} onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s/g, '_'))} className={`${inputClass} pl-10`} placeholder="e.g. alex_johnson" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Lowercase letters, numbers, and underscores only.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground"><Lock size={15} /></span>
                      <input id="reg-password" type={showPassword ? 'text' : 'password'} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className={`${inputClass} pl-10 pr-10`} placeholder="Min. 6 characters" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <button id="btn-reg-step1" type="button" onClick={handleRegisterNext} className="w-full bg-gradient-to-r from-primary to-fuchsia-600 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:from-primary/90 hover:to-fuchsia-600/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]">
                    <span>Continue to Personal Info</span><ChevronRight size={15} />
                  </button>
                </div>
              )}

              {/* --- Step 2: Personal Attributes --- */}
              {registerStep === 2 && (
                <div className="space-y-3 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className={labelClass}>Age (years)</label>
                      <input id="reg-age" type="number" min="1" max="120" value={age} onChange={(e) => setAge(e.target.value)} className={inputClass} placeholder="e.g. 32" />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Gender</label>
                      <select id="reg-gender" value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female')} className={`${inputClass} text-foreground`}>
                        <option value="male" className="bg-card">Male</option>
                        <option value="female" className="bg-card">Female</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Height (cm)</label>
                      <input id="reg-height" type="number" min="50" max="250" value={height} onChange={(e) => setHeight(e.target.value)} className={inputClass} placeholder="e.g. 170" />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Weight (kg)</label>
                      <input id="reg-weight" type="number" min="20" max="300" value={weight} onChange={(e) => setWeight(e.target.value)} className={inputClass} placeholder="e.g. 68" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setRegisterStep(1)} className="flex-1 border border-border/60 rounded-xl py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary/40 transition-all flex items-center justify-center gap-2">
                      <ChevronLeft size={15} />Back
                    </button>
                    <button id="btn-reg-step2" type="button" onClick={handleRegisterNext} className="flex-1 bg-gradient-to-r from-primary to-fuchsia-600 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:from-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]">
                      Clinical Vitals<ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* --- Step 3: Clinical Vitals --- */}
              {registerStep === 3 && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className={labelClass}><Heart size={10} className="inline mr-1" />BP Systolic (mmHg)</label>
                      <input id="reg-bp-s" type="number" value={bpSystolic} onChange={(e) => setBpSystolic(e.target.value)} className={inputClass} placeholder="120" />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}><Heart size={10} className="inline mr-1" />BP Diastolic (mmHg)</label>
                      <input id="reg-bp-d" type="number" value={bpDiastolic} onChange={(e) => setBpDiastolic(e.target.value)} className={inputClass} placeholder="80" />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Glucose (mg/dL)</label>
                      <input id="reg-glucose" type="number" value={glucose} onChange={(e) => setGlucose(e.target.value)} className={inputClass} placeholder="90" />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Heart Rate (bpm)</label>
                      <input id="reg-hr" type="number" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} className={inputClass} placeholder="72" />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}><Moon size={10} className="inline mr-1" />Sleep (hrs/night)</label>
                      <input id="reg-sleep" type="number" step="0.5" value={sleepDuration} onChange={(e) => setSleepDuration(e.target.value)} className={inputClass} placeholder="7" />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Stress Level (1–10)</label>
                      <input id="reg-stress" type="number" min="1" max="10" value={stressLevel} onChange={(e) => setStressLevel(e.target.value)} className={inputClass} placeholder="4" />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Daily Steps</label>
                      <input id="reg-steps" type="number" value={dailySteps} onChange={(e) => setDailySteps(e.target.value)} className={inputClass} placeholder="7000" />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}><Dumbbell size={10} className="inline mr-1" />Exercise (days/wk)</label>
                      <input id="reg-exercise" type="number" step="0.5" min="0" max="7" value={exerciseFrequency} onChange={(e) => setExerciseFrequency(e.target.value)} className={inputClass} placeholder="3" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className={labelClass}><Cigarette size={10} className="inline mr-1" />Smoking</label>
                      <select id="reg-smoking" value={smoking} onChange={(e) => setSmoking(e.target.value as any)} className={`${inputClass} text-foreground`}>
                        <option value="non-smoker" className="bg-card">Non-Smoker</option>
                        <option value="smoker" className="bg-card">Smoker</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}><Droplets size={10} className="inline mr-1" />Alcohol</label>
                      <select id="reg-alcohol" value={alcohol} onChange={(e) => setAlcohol(e.target.value as any)} className={`${inputClass} text-foreground`}>
                        <option value="none" className="bg-card">None</option>
                        <option value="moderate" className="bg-card">Moderate</option>
                        <option value="high" className="bg-card">High</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Family History</label>
                      <select id="reg-family" value={familyHistory} onChange={(e) => setFamilyHistory(e.target.value as any)} className={`${inputClass} text-foreground`}>
                        <option value="no" className="bg-card">No</option>
                        <option value="yes" className="bg-card">Yes</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setRegisterStep(2)} className="flex-1 border border-border/60 rounded-xl py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary/40 transition-all flex items-center justify-center gap-2">
                      <ChevronLeft size={15} />Back
                    </button>
                    <button
                      id="btn-reg-submit"
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-primary to-fuchsia-600 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:from-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-70"
                    >
                      {loading ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Creating Account...</span></>
                      ) : (
                        <><CheckCircle size={15} /><span>Create My Account</span></>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
