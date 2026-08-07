import React from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../data/translations';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import {
  Trophy,
  Activity,
  Heart,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  Award,
  Clock,
  Sparkles,
  FileText
} from 'lucide-react';

const monthlyProgressData = [
  { month: "Mar", healthScore: 74 },
  { month: "Apr", healthScore: 76 },
  { month: "May", healthScore: 80 },
  { month: "Jun", healthScore: 83 }
];

export const Profile: React.FC = () => {
  const { language, healthData, currentScores, name, username } = useApp();
  const t = translations[language] || translations.en;

  const bmi = healthData.weight / Math.pow(healthData.height / 100, 2);

  // List of medical achievements gamifying physical goals
  const achievements = [
    {
      id: 'a1',
      title: 'Active Explorer',
      description: 'Logged over 8,000 steps in a single day.',
      unlocked: healthData.dailySteps > 8000,
      icon: TrendingUp,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
    },
    {
      id: 'a2',
      title: 'Sleep Champion',
      description: 'Stabilized sleep cycles above 7 hours.',
      unlocked: healthData.sleepDuration >= 7,
      icon: Award,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/25'
    },
    {
      id: 'a3',
      title: 'Risk Deflector',
      description: 'Successfully modeled and lowered risk factor scores in simulator.',
      unlocked: true,
      icon: Sparkles,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/25'
    },
    {
      id: 'a4',
      title: 'Heart Guardian',
      description: 'Achieved healthy blood pressure baseline under 120/80 mmHg.',
      unlocked: healthData.bpSystolic <= 120 && healthData.bpDiastolic <= 80,
      icon: Heart,
      color: 'text-pink-500 bg-pink-500/10 border-pink-500/25'
    }
  ];

  const recentReports = [
    { id: 'rep1', name: 'Comprehensive Metabolic Panel', date: 'June 18, 2026', size: '2.4 MB', type: 'Lab PDF' },
    { id: 'rep2', name: 'Cardiac Output ECG Summary', date: 'June 12, 2026', size: '1.8 MB', type: 'ECG Plot' },
    { id: 'rep3', name: 'Hypertension Screening Record', date: 'May 28, 2026', size: '940 KB', type: 'BP Log' }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Top Header Card */}
      <div className="bg-card/45 backdrop-blur-md border border-border/60 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col sm:flex-row items-center gap-6">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary via-purple-500 to-pink-500 p-1 shrink-0 shadow-lg">
          <div className="w-full h-full rounded-full bg-card flex items-center justify-center font-black text-2xl text-gradient">
            {name != null && name.length > 0 ? name.charAt(0).toUpperCase() : '?'}
          </div>
        </div>

        {/* Profile Meta info */}
        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
            <h3 className="text-xl font-bold">{name ?? 'User'}</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              PREMIUM HEALTHCARE ASSIST
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
            Registered Patient • Username: @{username ?? 'user'}
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 text-xs font-semibold text-muted-foreground pt-1">
            <span>Height: {healthData.height} cm</span>
            <span>•</span>
            <span>Weight: {healthData.weight} kg</span>
            <span>•</span>
            <span>BMI: {bmi > 0 ? bmi.toFixed(1) : 'N/A'}</span>
          </div>
        </div>

        {/* Health Score Shield */}
        <div className="bg-secondary/35 border border-border/40 p-4 rounded-2xl text-center shadow-inner shrink-0 sm:self-stretch flex flex-col justify-center min-w-[120px]">
          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Health Index</p>
          <p className="text-3xl font-black font-mono text-primary mt-1">{currentScores.overallHealth}</p>
        </div>
      </div>

      {/* Grid: Left Monthly Progress, Right Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        {/* Monthly Progress Chart */}
        <div className="bg-card/35 backdrop-blur-md border border-border/60 rounded-3xl p-5 md:p-6 shadow-lg space-y-4">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-2">
            <Calendar size={14} /> Monthly Progress Trend
          </h4>
          
          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyProgressData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="gray" fontSize={11} tickLine={false} />
                <YAxis stroke="gray" fontSize={11} domain={[60, 95]} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgb(24 24 27)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Line
                  type="monotone"
                  dataKey="healthScore"
                  name="Health Score"
                  stroke="rgb(168, 85, 247)"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                  dot={{ strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Achievements Card */}
        <div className="bg-card/35 backdrop-blur-md border border-border/60 rounded-3xl p-5 md:p-6 shadow-lg space-y-4">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-2">
            <Trophy size={14} /> Health Milestones & Badges
          </h4>

          <div className="grid grid-cols-2 gap-3.5">
            {achievements.map((ach) => {
              const Icon = ach.icon;
              return (
                <div
                  key={ach.id}
                  className={`p-3 border rounded-2xl space-y-1.5 transition-all text-left flex flex-col justify-between ${
                    ach.unlocked
                      ? ach.color + ' opacity-100 shadow-md'
                      : 'border-border/40 bg-secondary/10 text-muted-foreground/40 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold uppercase font-mono tracking-wide">
                      {ach.unlocked ? 'UNLOCKED' : 'LOCKED'}
                    </span>
                    <Icon size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">{ach.title}</h5>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{ach.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Recent Lab Reports Card */}
      <div className="bg-card/35 backdrop-blur-md border border-border/60 rounded-3xl p-5 md:p-6 shadow-lg space-y-4">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-2">
          <FileText size={14} /> Registered Clinical Reports Ledger
        </h4>

        <div className="space-y-2">
          {recentReports.map((report) => (
            <div
              key={report.id}
              className="p-3.5 bg-secondary/35 hover:bg-secondary/65 border border-border/50 rounded-2xl flex items-center justify-between transition-colors text-xs font-semibold group cursor-pointer"
            >
              <div className="flex items-center space-x-3.5">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/20 group-hover:bg-primary/25 transition-colors">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="font-bold text-foreground">{report.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{report.date} • {report.type}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 text-muted-foreground group-hover:text-foreground">
                <span className="text-[10px] font-mono">{report.size}</span>
                <ArrowUpRight size={15} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
