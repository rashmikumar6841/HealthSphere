import React from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../data/translations';
import {
  Moon,
  Activity,
  Heart,
  TrendingUp,
  Smile,
  CheckCircle,
  CalendarDays,
  ArrowRight,
  TrendingDown,
  Sparkles
} from 'lucide-react';

export const Timeline: React.FC = () => {
  const { language, timelineEvents } = useApp();
  const t = translations[language] || translations.en;

  // Map icon strings to actual Lucide Components
  const getIcon = (iconName: string, type: string) => {
    let strokeClass = 'text-primary';
    if (type === 'improvement') strokeClass = 'text-emerald-400';
    if (type === 'risk-increase') strokeClass = 'text-pink-400';

    switch (iconName) {
      case 'Moon':
        return <Moon className={strokeClass} size={18} />;
      case 'Activity':
        return <Activity className={strokeClass} size={18} />;
      case 'Heart':
        return <Heart className={strokeClass} size={18} />;
      case 'TrendingUp':
        return <TrendingUp className={strokeClass} size={18} />;
      case 'Smile':
        return <Smile className={strokeClass} size={18} />;
      case 'CheckCircle':
        return <CheckCircle className={strokeClass} size={18} />;
      default:
        return <CalendarDays className={strokeClass} size={18} />;
    }
  };

  const getBorderColor = (type: string) => {
    if (type === 'improvement') return 'border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5';
    if (type === 'risk-increase') return 'border-pink-500/30 hover:border-pink-500/60 bg-pink-500/5';
    return 'border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-500/5';
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      
      {/* Header Description */}
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight">{t.timelineTitle}</h2>
        <p className="text-sm text-muted-foreground">
          A longitudinal vertical ledger tracking how lifestyle shifts dynamically trigger model risk fluctuations.
        </p>
      </div>

      {/* Timeline Section */}
      <div className="relative pl-6 md:pl-10 space-y-6 pt-4">
        
        {/* Central Vertical Connecting Line */}
        <div className="absolute left-9 md:left-13 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary via-purple-500 to-emerald-500/60"></div>

        {timelineEvents.map((event, idx) => {
          const isEven = idx % 2 === 0;
          return (
            <div key={event.id} className="relative flex flex-col md:flex-row md:items-center gap-4 group">
              
              {/* Vertical Circle Indicator Node */}
              <div className={`absolute -left-9 md:-left-13 p-2 rounded-full z-10 transition-transform duration-200 group-hover:scale-110 border ${
                event.type === 'improvement'
                  ? 'bg-emerald-950 border-emerald-500/50 text-emerald-400'
                  : event.type === 'risk-increase'
                  ? 'bg-pink-950 border-pink-500/50 text-pink-400'
                  : 'bg-indigo-950 border-indigo-500/50 text-indigo-400'
              }`}>
                <div className="w-5 h-5 flex items-center justify-center">
                  {getIcon(event.icon, event.type)}
                </div>
              </div>

              {/* Event Card Content */}
              <div className="flex-1 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                
                {/* Date stamp left panel (desktop) */}
                <div className="md:w-32 shrink-0 md:text-right font-mono text-[11px] font-bold text-muted-foreground uppercase tracking-widest pt-1 md:pt-0">
                  {event.date}
                </div>

                {/* Main Card body */}
                <div className={`flex-1 p-5 border rounded-2xl transition-all duration-300 shadow-md ${getBorderColor(event.type)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-foreground">{event.title}</h3>
                    
                    {event.type === 'improvement' && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        Physiological Deflection
                      </span>
                    )}

                    {event.type === 'risk-increase' && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/20">
                        Vascular Strain Trigger
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {event.description}
                  </p>

                  {/* Micro simulated connections inside timeline cards */}
                  {event.id === 't3' && (
                    <div className="mt-3 pt-2.5 border-t border-border/30 flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
                      <Sparkles size={12} className="text-pink-400" />
                      <span>Attributed triggers: Sleep decline (1.3h reduction), Stress spike (+3 points)</span>
                    </div>
                  )}

                  {event.id === 't6' && (
                    <div className="mt-3 pt-2.5 border-t border-border/30 flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                      <CheckCircle size={12} />
                      <span>Attributed deflection: Sleep restoration (+1.4h), BP decrease (12 mmHg drop)</span>
                    </div>
                  )}
                </div>

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
};
