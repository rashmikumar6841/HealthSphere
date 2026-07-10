import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { translations } from '../data/translations';
import { weeklyHealthData } from '../data/dummyCharts';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  Heart,
  Activity,
  Moon,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Smile,
  Zap,
  ArrowUpRight,
  Flame,
  Droplet
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { language, currentScores, healthData, recommendations, timelineEvents } = useApp();
  const navigate = useNavigate();
  const t = translations[language] || translations.en;

  // Custom tooltips for graphs
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/90 border border-border/80 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs space-y-1">
          <p className="font-bold text-foreground">{label}</p>
          {payload.map((pld: any) => (
            <p key={pld.name} style={{ color: pld.color }} className="font-semibold">
              {pld.name}: {pld.value} {pld.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Determine risk levels
  const getHeartRiskColor = (risk: number) => {
    if (risk > 60) return 'text-amber-500 bg-amber-500/10 border-amber-500/25';
    if (risk > 35) return 'text-violet-400 bg-violet-400/10 border-violet-400/25';
    return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25';
  };

  const getGlucoseState = (val: number) => {
    if (val > 125) return { text: 'Diabetic Range', color: 'text-amber-500 bg-amber-500/10' };
    if (val > 100) return { text: 'Prediabetic Range', color: 'text-violet-400 bg-violet-400/10' };
    return { text: 'Normal Fasting', color: 'text-emerald-400 bg-emerald-400/10' };
  };

  const glucoseState = getGlucoseState(healthData.glucose);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-primary/15 via-fuchsia-500/5 to-transparent rounded-2xl border border-border/30 backdrop-blur-sm">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 font-black">Rashmi</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Platform live. Your explainable clinical decision system is active.
          </p>
        </div>
        <button
          onClick={() => navigate('/simulation')}
          className="self-start md:self-auto bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-xl text-xs hover:bg-primary/90 transition-all flex items-center space-x-1.5 shadow-md shadow-primary/20 active:scale-[0.98]"
        >
          <span>Open What-If Simulator</span>
          <ArrowUpRight size={14} />
        </button>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Core Health Score Indicator */}
        <div className="bg-card/45 backdrop-blur-md border border-border/60 rounded-2xl p-5 flex flex-col justify-between items-center text-center shadow-lg group hover:border-primary/40 transition-all">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t.overallHealth}</p>
          
          <div className="relative my-4 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="38"
                stroke="currentColor"
                strokeWidth="7"
                fill="transparent"
                className="text-muted/20"
              />
              <circle
                cx="48"
                cy="48"
                r="38"
                stroke="url(#primaryGradient)"
                strokeWidth="7"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 38}
                strokeDashoffset={2 * Math.PI * 38 * (1 - currentScores.overallHealth / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgb(168, 85, 247)" />
                  <stop offset="100%" stopColor="rgb(236, 72, 153)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute font-black text-2xl font-mono tracking-tighter">
              {currentScores.overallHealth}
            </div>
          </div>
          
          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Stable Baseline
          </span>
        </div>

        {/* Heart Risk Score */}
        <div className="bg-card/45 backdrop-blur-md border border-border/60 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-border transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t.heartRisk}</p>
            <Heart className="text-pink-500" size={16} />
          </div>
          <div className="my-3">
            <h3 className="text-3xl font-black font-mono tracking-tighter">{currentScores.heartRisk}%</h3>
            <div className="w-full bg-muted/30 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-pink-500 to-purple-600 h-full rounded-full transition-all duration-700"
                style={{ width: `${currentScores.heartRisk}%` }}
              ></div>
            </div>
          </div>
          <span className={`text-[10px] font-bold py-1 px-2.5 rounded-full border text-center ${getHeartRiskColor(currentScores.heartRisk)}`}>
            {currentScores.heartRisk > 60 ? 'Cardio Risk Elevated' : currentScores.heartRisk > 35 ? 'Moderate Risk' : 'Low Cardiac Risk'}
          </span>
        </div>

        {/* Diabetes Risk Score */}
        <div className="bg-card/45 backdrop-blur-md border border-border/60 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-border transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t.diabetesRisk}</p>
            <Activity className="text-indigo-400" size={16} />
          </div>
          <div className="my-3">
            <h3 className="text-3xl font-black font-mono tracking-tighter">{currentScores.diabetesRisk}%</h3>
            <div className="w-full bg-muted/30 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full transition-all duration-700"
                style={{ width: `${currentScores.diabetesRisk}%` }}
              ></div>
            </div>
          </div>
          <span className={`text-[10px] font-bold py-1 px-2.5 rounded-full border text-center ${glucoseState.color}`}>
            {glucoseState.text}
          </span>
        </div>

        {/* Sleep Score */}
        <div className="bg-card/45 backdrop-blur-md border border-border/60 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-border transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t.sleepScore}</p>
            <Moon className="text-sky-400" size={16} />
          </div>
          <div className="my-3">
            <h3 className="text-3xl font-black font-mono tracking-tighter">{currentScores.sleepScore}/100</h3>
            <div className="w-full bg-muted/30 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${currentScores.sleepScore}%` }}
              ></div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-sky-400 bg-sky-400/10 border border-sky-400/25 py-1 px-2.5 rounded-full text-center">
            {healthData.sleepDuration} hrs average
          </span>
        </div>

        {/* Stress Score */}
        <div className="bg-card/45 backdrop-blur-md border border-border/60 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-border transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t.stressScore}</p>
            <AlertTriangle className="text-amber-400" size={16} />
          </div>
          <div className="my-3">
            <h3 className="text-3xl font-black font-mono tracking-tighter">{currentScores.stressScore}/100</h3>
            <div className="w-full bg-muted/30 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${currentScores.stressScore}%` }}
              ></div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/25 py-1 px-2.5 rounded-full text-center">
            {healthData.stressLevel > 6 ? 'High Cortisol Load' : 'Stable Load'}
          </span>
        </div>

      </div>

      {/* Main Charts Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sleep Duration Trend */}
        <div className="bg-card/30 backdrop-blur-md border border-border/40 rounded-2xl p-5 shadow-lg">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t.sleepTrend}</h4>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyHealthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(56, 189, 248)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="rgb(56, 189, 248)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="gray" fontSize={11} tickLine={false} />
                <YAxis stroke="gray" fontSize={11} domain={[4, 9]} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="sleepHours" name="Sleep" unit=" hrs" stroke="rgb(56, 189, 248)" strokeWidth={2} fillOpacity={1} fill="url(#sleepGrad)" />
                <ReferenceLine y={7.2} label={{ value: 'Target 7.2h', fill: '#38bdf8', fontSize: 10, position: 'top' }} stroke="#38bdf8" strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Blood Pressure Trend */}
        <div className="bg-card/30 backdrop-blur-md border border-border/40 rounded-2xl p-5 shadow-lg">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t.bpTrend}</h4>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyHealthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="gray" fontSize={11} tickLine={false} />
                <YAxis stroke="gray" fontSize={11} domain={[70, 150]} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="bpSystolic" name="Systolic (Pressure)" unit=" mmHg" stroke="rgb(168, 85, 247)" strokeWidth={2} activeDot={{ r: 6 }} dot={true} />
                <Line type="monotone" dataKey="bpDiastolic" name="Diastolic (Resting)" unit=" mmHg" stroke="rgb(236, 72, 153)" strokeWidth={2} dot={true} />
                <ReferenceLine y={120} stroke="rgba(168, 85, 247, 0.4)" strokeDasharray="3 3" />
                <ReferenceLine y={80} stroke="rgba(236, 72, 153, 0.4)" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Glucose Trend */}
        <div className="bg-card/30 backdrop-blur-md border border-border/40 rounded-2xl p-5 shadow-lg">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t.glucoseTrend}</h4>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyHealthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="glucGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(244, 63, 94)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="rgb(244, 63, 94)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="gray" fontSize={11} tickLine={false} />
                <YAxis stroke="gray" fontSize={11} domain={[80, 130]} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="glucose" name="Fasting Glucose" unit=" mg/dL" stroke="rgb(244, 63, 94)" strokeWidth={2} fill="url(#glucGrad)" />
                <ReferenceLine y={100} label={{ value: 'Prediabetic Cap (100)', fill: '#f43f5e', fontSize: 10, position: 'right' }} stroke="#f43f5e" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Step Activity */}
        <div className="bg-card/30 backdrop-blur-md border border-border/40 rounded-2xl p-5 shadow-lg">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t.activityTrend}</h4>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyHealthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="gray" fontSize={11} tickLine={false} />
                <YAxis stroke="gray" fontSize={11} domain={[0, 10000]} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="steps" name="Steps Taken" unit=" steps" fill="rgb(34, 197, 94)" radius={[4, 4, 0, 0]} barSize={28} />
                <ReferenceLine y={8000} label={{ value: 'Goal 8k', fill: '#22c55e', fontSize: 10, position: 'top' }} stroke="#22c55e" strokeDasharray="3 3" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Split Section: Today's Summary & Timeline Snapshot */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Today's Summary Card */}
        <div className="bg-card/45 backdrop-blur-md border border-border/60 rounded-2xl p-5 shadow-lg space-y-4 xl:col-span-1">
          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Today's Summary</h4>
          
          <div className="space-y-3">
            {/* Calorie Progress */}
            <div className="p-3.5 bg-secondary/35 border border-border/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center text-orange-400 gap-1.5">
                  <Flame size={14} /> Calorie Intakes
                </span>
                <span className="text-muted-foreground">1,820 / 2,200 kcal</span>
              </div>
              <div className="w-full bg-muted/30 h-2 rounded-full overflow-hidden">
                <div className="bg-orange-500 h-full" style={{ width: '82%' }}></div>
              </div>
            </div>

            {/* Hydration Progress */}
            <div className="p-3.5 bg-secondary/35 border border-border/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center text-sky-400 gap-1.5">
                  <Droplet size={14} /> Daily Hydration
                </span>
                <span className="text-muted-foreground">2.2 / 3.0 L</span>
              </div>
              <div className="w-full bg-muted/30 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-400 h-full" style={{ width: '73%' }}></div>
              </div>
            </div>

            {/* Exercise Time */}
            <div className="p-3.5 bg-secondary/35 border border-border/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center text-emerald-400 gap-1.5">
                  <Zap size={14} /> Active Movement
                </span>
                <span className="text-muted-foreground">45 / 30 mins</span>
              </div>
              <div className="w-full bg-muted/30 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Indicators */}
          <div className="pt-2 grid grid-cols-2 gap-2 text-center text-xs font-semibold">
            <div className="p-2.5 rounded-xl bg-secondary/20 border border-border/30">
              <p className="text-muted-foreground font-medium text-[10px] uppercase">RESTING HR</p>
              <p className="text-lg font-bold text-foreground font-mono mt-0.5">{healthData.heartRate} bpm</p>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/20 border border-border/30">
              <p className="text-muted-foreground font-medium text-[10px] uppercase">BMI METRIC</p>
              <p className="text-lg font-bold text-foreground font-mono mt-0.5">
                {(healthData.weight / Math.pow(healthData.height / 100, 2)).toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Latest Recommendations */}
        <div className="bg-card/45 backdrop-blur-md border border-border/60 rounded-2xl p-5 shadow-lg space-y-4 xl:col-span-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">High Priority Actions</h4>
            <button
              onClick={() => navigate('/recommendations')}
              className="text-xs text-primary hover:underline font-semibold flex items-center"
            >
              See All <ChevronRight size={14} />
            </button>
          </div>
          
          <div className="space-y-3">
            {recommendations.slice(0, 2).map((rec) => (
              <div
                key={rec.id}
                onClick={() => navigate('/recommendations')}
                className="p-3.5 bg-secondary/30 hover:bg-secondary/65 border border-border/50 hover:border-primary/30 rounded-xl space-y-2 cursor-pointer transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    {rec.priority} PRIORITY
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground font-mono">
                    Conf: {rec.confidenceScore}%
                  </span>
                </div>
                <h5 className="text-xs font-bold">{rec.title}</h5>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {rec.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Health Events & Timeline Summary */}
        <div className="bg-card/45 backdrop-blur-md border border-border/60 rounded-2xl p-5 shadow-lg space-y-4 xl:col-span-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Recent Health Events</h4>
            <button
              onClick={() => navigate('/timeline')}
              className="text-xs text-primary hover:underline font-semibold flex items-center"
            >
              Timeline <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3.5">
            {timelineEvents.slice(0, 3).map((event) => (
              <div key={event.id} className="flex space-x-3 text-xs leading-normal">
                <div className="relative flex flex-col items-center">
                  <div className={`p-1.5 rounded-full shrink-0 ${
                    event.type === 'improvement'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : event.type === 'risk-increase'
                      ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                      : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                  }`}>
                    {event.type === 'improvement' ? <Smile size={12} /> : <AlertTriangle size={12} />}
                  </div>
                  <div className="w-[1px] h-full bg-border mt-1"></div>
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-foreground">{event.title}</p>
                    <span className="text-[9px] text-muted-foreground font-mono">{event.date}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
