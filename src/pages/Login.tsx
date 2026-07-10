import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BrainCircuit, Lock, Mail, Sparkles, Activity, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { setIsLoggedIn, theme } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('rashmi@vitalpredict.ai');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate a brief, satisfying loader to showcase SaaS premium feel
    setTimeout(() => {
      setIsLoggedIn(true);
      setLoading(false);
      navigate('/');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-grid-glow bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      
      {/* Background Radial Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Floating Sparkles in Background */}
      <div className="absolute top-10 left-10 animate-bounce text-primary/30 hidden md:block">
        <Sparkles size={32} />
      </div>
      <div className="absolute bottom-12 right-20 animate-pulse text-indigo-500/20 hidden md:block">
        <BrainCircuit size={48} />
      </div>

      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center bg-card/30 backdrop-blur-xl border border-border/60 rounded-3xl p-6 md:p-10 shadow-2xl relative z-10">
        
        {/* Left Side: Custom Health Intelligence Illustration */}
        <div className="hidden md:flex flex-col space-y-6 justify-center pr-6 border-r border-border/30">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-tr from-primary to-fuchsia-500 rounded-2xl text-white shadow-xl shadow-primary/20">
              <BrainCircuit size={32} className="animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-gradient">VitalPredict</h2>
              <p className="text-xs font-mono tracking-widest text-muted-foreground uppercase font-bold">Health Decision Support Platform</p>
            </div>
          </div>

          <div className="relative p-6 bg-secondary/30 rounded-2xl border border-border/40 overflow-hidden group">
            {/* Pulsing Grid illustration inside card */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">EXPLAINABLE CORE</span>
              <Activity size={18} className="text-primary animate-pulse" />
            </div>

            {/* Neural network / ECG simulation inline SVG */}
            <svg className="w-full h-32 text-muted-foreground/30" viewBox="0 0 300 100">
              {/* Grid Lines */}
              <line x1="0" y1="50" x2="300" y2="50" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="100" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="200" y1="0" x2="200" y2="100" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
              
              {/* ECG Wave */}
              <path
                d="M0,50 L80,50 L90,30 L100,70 L110,15 L120,85 L130,50 L180,50 L190,40 L195,60 L200,30 L205,80 L210,50 L300,50"
                fill="none"
                stroke="url(#ecgGradient)"
                strokeWidth="2.5"
                className="path-animate"
              />

              {/* Neural Nodes */}
              <circle cx="110" cy="15" r="5" fill="rgb(168, 85, 247)" className="animate-ping" style={{ transformOrigin: '110px 15px' }} />
              <circle cx="110" cy="15" r="4" fill="rgb(168, 85, 247)" />
              <circle cx="200" cy="30" r="4" fill="rgb(236, 72, 153)" />
              
              {/* Connector lines to nodes */}
              <line x1="110" y1="15" x2="150" y2="25" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1" />
              <line x1="200" y1="30" x2="150" y2="25" stroke="rgba(236, 72, 153, 0.4)" strokeWidth="1" />
              <circle cx="150" cy="25" r="5" fill="rgb(59, 130, 246)" />

              {/* Gradients definitions */}
              <defs>
                <linearGradient id="ecgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(99, 102, 241)" />
                  <stop offset="50%" stopColor="rgb(168, 85, 247)" />
                  <stop offset="100%" stopColor="rgb(236, 72, 153)" />
                </linearGradient>
              </defs>
            </svg>

            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">Interactive Counterfactual Modeling</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                VitalPredict uses game-theoretic SHAP tree-explainers to compute patient risk weights, helping doctors understand the exact physiological triggers of chronic diseases.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs text-muted-foreground px-1">
            <ShieldCheck className="text-emerald-500 shrink-0" size={16} />
            <span>Fully compliant with HIPAA and GDPR data privacy standards.</span>
          </div>
        </div>

        {/* Right Side: Centered Login Card */}
        <div className="flex flex-col space-y-6">
          <div className="md:hidden flex flex-col items-center space-y-2 mb-4">
            <div className="p-3 bg-gradient-to-tr from-primary to-fuchsia-500 rounded-xl text-white">
              <BrainCircuit size={28} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-gradient">VitalPredict</h2>
            <p className="text-xs text-muted-foreground">Explainable Health Decision Support Platform</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight">Welcome Back</h3>
            <p className="text-sm text-muted-foreground">Access your health intelligence dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground">
                  <Mail size={16} />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-secondary/35 border border-border/80 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                  placeholder="name@vitalpredict.ai"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="password">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => e.preventDefault()}
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground">
                  <Lock size={16} />
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-secondary/35 border border-border/80 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="rounded border-border text-primary focus:ring-primary w-4 h-4 bg-secondary"
                />
                <span className="text-xs text-muted-foreground select-none">Remember this device</span>
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-primary to-fuchsia-600 hover:from-primary/90 hover:to-fuchsia-600/90 text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-lg shadow-primary/20 active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to Platform</span>
              )}
            </button>
          </form>

          {/* Dummy Credentials Alert */}
          <div className="mt-4 p-3.5 bg-secondary/40 border border-border/50 rounded-xl text-center">
            <p className="text-[11px] text-muted-foreground leading-normal">
              <span className="font-bold text-primary">Prototype Credentials:</span> You can sign in using any email and password. Click the button to view the dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
