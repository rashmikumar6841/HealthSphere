import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../data/translations';
import {
  Sliders,
  RotateCcw,
  Sparkles,
  Play,
  Heart,
  Activity,
  Moon,
  AlertTriangle,
  TrendingDown,
  ArrowRight,
  Gauge,
  Lightbulb
} from 'lucide-react';

export const Simulation: React.FC = () => {
  const {
    language,
    healthData,
    simParameters,
    setSimParameters,
    currentScores,
    simulatedScores,
    runSimulation,
    resetSimulation
  } = useApp();

  const [loading, setLoading] = useState(false);
  const t = translations[language] || translations.en;

  const handleSliderChange = (name: keyof typeof simParameters, value: number) => {
    setSimParameters({
      ...simParameters,
      [name]: value,
    });
  };

  const handleRun = () => {
    setLoading(true);
    // Simulate complex model inference with a sleek 900ms delay
    setTimeout(() => {
      runSimulation();
      setLoading(false);
    }, 900);
  };

  const handleReset = () => {
    resetSimulation();
  };

  // Calculate percentage risk drops
  const getRiskDrop = (before: number, after: number) => {
    const diff = before - after;
    if (diff <= 0) return { text: `+${Math.abs(diff)}% Increase`, isGood: false };
    return { text: `-${diff}% Reduction`, isGood: true };
  };

  const getScoreDiff = (before: number, after: number) => {
    const diff = after - before;
    if (diff >= 0) return { text: `+${diff} Points`, isGood: true };
    return { text: `${diff} Points`, isGood: false };
  };

  // Generate dynamic SHAP-like explanations for changes
  const getShapExplanations = () => {
    const explanations = [];
    const wtDiff = healthData.weight - simParameters.weight;
    const exDiff = simParameters.exercise - healthData.exerciseFrequency;
    const slDiff = simParameters.sleep - healthData.sleepDuration;
    const strDiff = healthData.stressLevel - simParameters.stress;

    if (wtDiff > 0) {
      explanations.push({
        feature: 'Weight Reduction',
        detail: `Losing ${wtDiff.toFixed(1)} kg reduces systolic BP load and cellular inflammation.`,
        impact: `-${(wtDiff * 1.5).toFixed(0)}% Heart Risk • -${(wtDiff * 2).toFixed(0)}% Diabetes Risk`,
        type: 'positive'
      });
    } else if (wtDiff < 0) {
      explanations.push({
        feature: 'Weight Increase',
        detail: `Gaining ${Math.abs(wtDiff).toFixed(1)} kg increases vascular wall resistance and cardiac workload.`,
        impact: `+${(Math.abs(wtDiff) * 1.5).toFixed(0)}% Heart Risk • +${(Math.abs(wtDiff) * 2).toFixed(0)}% Diabetes Risk`,
        type: 'negative'
      });
    }

    if (exDiff > 0) {
      explanations.push({
        feature: 'Exercise Frequency',
        detail: `Increasing activity by ${exDiff.toFixed(1)} days/week improves non-insulin glucose clearance.`,
        impact: `-${(exDiff * 3).toFixed(0)}% Heart Risk • -${(exDiff * 4).toFixed(0)}% Diabetes Risk`,
        type: 'positive'
      });
    }

    if (slDiff > 0) {
      explanations.push({
        feature: 'Sleep Optimization',
        detail: `Gaining ${slDiff.toFixed(1)}h of sleep lowers vascular resistance and stabilizes sympathetic tone.`,
        impact: `-${(slDiff * 2).toFixed(0)}% Heart Risk • Improves Sleep Score by +${(slDiff * 15).toFixed(0)}`,
        type: 'positive'
      });
    }

    if (strDiff > 0) {
      explanations.push({
        feature: 'Stress Control',
        detail: `Lowering stress index by ${strDiff} points reduces resting HR and circulating epinephrine.`,
        impact: `-${(strDiff * 1.5).toFixed(0)}% Heart Risk • Improves Sleep Quality`,
        type: 'positive'
      });
    }

    if (explanations.length === 0) {
      explanations.push({
        feature: 'No Lifestyle Shifts',
        detail: 'Simulated parameters match your baseline health profile.',
        impact: 'Overall risk indexes remain unchanged.',
        type: 'neutral'
      });
    }

    return explanations;
  };

  const shapImpacts = getShapExplanations();

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight">{t.simulationTitle}</h2>
        <p className="text-sm text-muted-foreground">
          What-If counterfactual simulation. Model the potential impact of healthy lifestyle adjustments before committing to them.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Sliders Controls (5 cols) */}
        <div className="lg:col-span-5 bg-card/45 backdrop-blur-md border border-border/60 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 border-b border-border/40 pb-2">
              <Sliders size={14} /> Counterfactual Controls
            </h3>

            {/* Sliders Container */}
            <div className="space-y-5">
              {/* Sleep Duration */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">Daily Sleep Duration</span>
                  <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {simParameters.sleep.toFixed(1)} hrs
                  </span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="10"
                  step="0.5"
                  value={simParameters.sleep}
                  onChange={(e) => handleSliderChange('sleep', parseFloat(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-secondary/80 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>Actual: {healthData.sleepDuration} hrs</span>
                  <span>Max: 10 hrs</span>
                </div>
              </div>

              {/* Exercise Frequency */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">Exercise Frequency</span>
                  <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {simParameters.exercise.toFixed(1)} days/week
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="7"
                  step="0.5"
                  value={simParameters.exercise}
                  onChange={(e) => handleSliderChange('exercise', parseFloat(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-secondary/80 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>Actual: {healthData.exerciseFrequency} days</span>
                  <span>Max: 7 days</span>
                </div>
              </div>

              {/* Calories */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">Daily Target Calories</span>
                  <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {simParameters.calories} kcal
                  </span>
                </div>
                <input
                  type="range"
                  min="1200"
                  max="3500"
                  step="50"
                  value={simParameters.calories}
                  onChange={(e) => handleSliderChange('calories', parseInt(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-secondary/80 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>Goal: 2,200 kcal</span>
                  <span>Max: 3,500 kcal</span>
                </div>
              </div>

              {/* Target Weight */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">Target Body Weight</span>
                  <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {simParameters.weight} kg
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="120"
                  step="1"
                  value={simParameters.weight}
                  onChange={(e) => handleSliderChange('weight', parseInt(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-secondary/80 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>Actual: {healthData.weight} kg</span>
                  <span>Min: 50 kg</span>
                </div>
              </div>

              {/* Stress Level */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">Stress Index Level</span>
                  <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {simParameters.stress}/10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={simParameters.stress}
                  onChange={(e) => handleSliderChange('stress', parseInt(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-secondary/80 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>Actual: {healthData.stressLevel}/10</span>
                  <span>Min: 1</span>
                </div>
              </div>

              {/* Water Intake */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">Daily Water Intake</span>
                  <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {simParameters.waterIntake.toFixed(1)} Liters
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={simParameters.waterIntake}
                  onChange={(e) => handleSliderChange('waterIntake', parseFloat(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-secondary/80 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>Goal: 3.0 L</span>
                  <span>Max: 5.0 L</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 border-t border-border/40 pt-4">
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center space-x-1.5 border border-border hover:bg-secondary rounded-xl py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
            >
              <RotateCcw size={14} />
              <span>{t.reset}</span>
            </button>
            
            <button
              onClick={handleRun}
              disabled={loading}
              className="flex-[2] flex items-center justify-center space-x-2 bg-gradient-to-r from-primary to-fuchsia-600 hover:from-primary/95 hover:to-fuchsia-600/95 text-white rounded-xl py-2.5 text-xs font-black transition-all shadow-lg shadow-primary/20 disabled:opacity-80 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Running SHAP explainer...</span>
                </>
              ) : (
                <>
                  <Play size={13} fill="currentColor" />
                  <span>{t.runSimulation}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Simulation Results Panel (7 cols) */}
        <div className="lg:col-span-7 bg-card/30 backdrop-blur-md border border-border/50 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col justify-center">
          
          {simulatedScores ? (
            <div className="space-y-6">
              
              {/* Before vs After Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-secondary/25 border border-border/40 rounded-2xl p-4">
                
                {/* Score Before */}
                <div className="text-center space-y-1 border-r border-border/30 last:border-none">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Baseline Score</p>
                  <p className="text-2xl font-black text-foreground font-mono">{currentScores.overallHealth}</p>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center text-primary py-2 sm:py-0 border-r border-border/30 last:border-none">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    getScoreDiff(currentScores.overallHealth, simulatedScores.overallHealth).isGood
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {getScoreDiff(currentScores.overallHealth, simulatedScores.overallHealth).text}
                  </span>
                  <ArrowRight size={20} className="mt-1 hidden sm:block" />
                </div>

                {/* Score After */}
                <div className="text-center space-y-1">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Simulated Score</p>
                  <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 font-mono">
                    {simulatedScores.overallHealth}
                  </p>
                </div>

              </div>

              {/* Comparison Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Heart Risk comparison */}
                <div className="p-4 bg-secondary/35 border border-border/50 rounded-2xl space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase">
                    <span>Heart Risk</span>
                    <Heart size={14} className="text-pink-500" />
                  </div>
                  
                  <div className="flex items-baseline space-x-2">
                    <span className="text-xl font-bold font-mono text-muted-foreground line-through">{currentScores.heartRisk}%</span>
                    <ArrowRight size={12} className="text-muted-foreground" />
                    <span className="text-2xl font-black font-mono text-foreground">{simulatedScores.heartRisk}%</span>
                  </div>

                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border inline-block ${
                    getRiskDrop(currentScores.heartRisk, simulatedScores.heartRisk).isGood
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {getRiskDrop(currentScores.heartRisk, simulatedScores.heartRisk).text}
                  </span>
                </div>

                {/* Diabetes Risk comparison */}
                <div className="p-4 bg-secondary/35 border border-border/50 rounded-2xl space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase">
                    <span>Diabetes Risk</span>
                    <Activity size={14} className="text-indigo-400" />
                  </div>
                  
                  <div className="flex items-baseline space-x-2">
                    <span className="text-xl font-bold font-mono text-muted-foreground line-through">{currentScores.diabetesRisk}%</span>
                    <ArrowRight size={12} className="text-muted-foreground" />
                    <span className="text-2xl font-black font-mono text-foreground">{simulatedScores.diabetesRisk}%</span>
                  </div>

                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border inline-block ${
                    getRiskDrop(currentScores.diabetesRisk, simulatedScores.diabetesRisk).isGood
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {getRiskDrop(currentScores.diabetesRisk, simulatedScores.diabetesRisk).text}
                  </span>
                </div>

                {/* Sleep Score comparison */}
                <div className="p-4 bg-secondary/35 border border-border/50 rounded-2xl space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase">
                    <span>Sleep Quality</span>
                    <Moon size={14} className="text-sky-400" />
                  </div>
                  
                  <div className="flex items-baseline space-x-2">
                    <span className="text-xl font-bold font-mono text-muted-foreground line-through">{currentScores.sleepScore}</span>
                    <ArrowRight size={12} className="text-muted-foreground" />
                    <span className="text-2xl font-black font-mono text-foreground">{simulatedScores.sleepScore}</span>
                  </div>

                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border inline-block ${
                    simulatedScores.sleepScore >= currentScores.sleepScore
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {simulatedScores.sleepScore >= currentScores.sleepScore ? `+${simulatedScores.sleepScore - currentScores.sleepScore} Improvement` : `${simulatedScores.sleepScore - currentScores.sleepScore} Decrease`}
                  </span>
                </div>

                {/* Stress Index comparison */}
                <div className="p-4 bg-secondary/35 border border-border/50 rounded-2xl space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase">
                    <span>Stress Score</span>
                    <AlertTriangle size={14} className="text-amber-400" />
                  </div>
                  
                  <div className="flex items-baseline space-x-2">
                    <span className="text-xl font-bold font-mono text-muted-foreground line-through">{currentScores.stressScore}</span>
                    <ArrowRight size={12} className="text-muted-foreground" />
                    <span className="text-2xl font-black font-mono text-foreground">{simulatedScores.stressScore}</span>
                  </div>

                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border inline-block ${
                    simulatedScores.stressScore <= currentScores.stressScore
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {simulatedScores.stressScore <= currentScores.stressScore ? `-${currentScores.stressScore - simulatedScores.stressScore} Stress Drop` : `+${simulatedScores.stressScore - currentScores.stressScore} Stress Spiked`}
                  </span>
                </div>
              </div>

              {/* Explainable SHAP Insights */}
              <div className="space-y-3 bg-secondary/15 border border-border/40 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb size={13} className="text-primary" /> ML Attribution Explanations (SHAP values)
                </h4>

                <div className="space-y-2">
                  {shapImpacts.map((shap, index) => (
                    <div key={index} className="text-xs leading-normal flex items-start space-x-2 border-b border-border/30 last:border-none pb-2 last:pb-0">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        shap.type === 'positive' ? 'bg-emerald-500' : shap.type === 'negative' ? 'bg-red-500' : 'bg-slate-400'
                      }`}></span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center font-bold">
                          <span>{shap.feature}</span>
                          <span className={`font-mono text-[10px] ${shap.type === 'positive' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {shap.impact}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{shap.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground space-y-3 px-4 max-w-md mx-auto">
              <div className="p-3 bg-primary/10 border border-primary/20 text-primary w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2 animate-pulse">
                <Gauge size={22} />
              </div>
              <h4 className="font-bold text-foreground">Awaiting Model Execution</h4>
              <p className="text-xs leading-relaxed">
                {t.runSimAlert}
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
