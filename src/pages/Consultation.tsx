import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../data/translations';
import {
  Download,
  Printer,
  FileText,
  Heart,
  Activity,
  Brain,
  Shield,
  ClipboardList,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export const Consultation: React.FC = () => {
  const { language, healthData, currentScores, recommendations, doctorQuestions, patientNotes, setPatientNotes, name, username } = useApp();
  const reportRef = useRef<HTMLDivElement>(null);
  const t = translations[language] || translations.en;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate simple metadata file download as a mock PDF exporter
    const content = `VITALPREDICT HEALTH CLINICAL CONSULTATION BRIEF
Generated: ${new Date().toLocaleDateString()}
Patient Name: ${name || 'User'} (@${username || 'user'})
Age: ${healthData.age} | Gender: ${healthData.gender}
Height: ${healthData.height}cm | Weight: ${healthData.weight}kg

CLINICAL METRICS SUMMARY:
- Overall Health Score: ${currentScores.overallHealth}/100
- Cardiovascular Event Risk: ${currentScores.heartRisk}%
- Metabolic Diabetes Risk: ${currentScores.diabetesRisk}%
- Sleep Quality Index: ${currentScores.sleepScore}/100
- Neuro-stress Burden: ${currentScores.stressScore}/100

ACTIVE VITALS:
- Blood Pressure: ${healthData.bpSystolic}/${healthData.bpDiastolic} mmHg
- Fasting Glucose: ${healthData.glucose} mg/dL
- Heart Rate: ${healthData.heartRate} BPM

PRIORITY CLINICAL RECOMMENDATIONS:
${recommendations.map((r, i) => `${i+1}. [${r.priority.toUpperCase()}] ${r.title}\n   - Reason: ${r.reason}\n   - Expected Impact: ${r.expectedImpact}`).join('\n\n')}

AUTO-GENERATED DISCUSSION QUESTIONS FOR PHYSICIAN:
${doctorQuestions.map((q, i) => `${i+1}. ${q}`).join('\n')}

PATIENT COMMENTS:
"${patientNotes}"

Disclaimer: This report was synthesized by the VitalPredict Explainable Decision Support Engine using trained XGBoost and Game-Theoretic SHAP attribution models. It is designed to support, not replace, clinical diagnosis.`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VitalPredict_Consultation_Brief_${username || 'user'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const bmi = healthData.weight / Math.pow(healthData.height / 100, 2);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Top Banner Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold tracking-tight">{t.brief}</h2>
          <p className="text-sm text-muted-foreground">
            Print or download this clinical digest to review with your doctor during consultation.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 border border-border hover:bg-secondary text-xs font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95 text-muted-foreground hover:text-foreground"
          >
            <Download size={14} />
            <span>{t.downloadPDF}</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-xl text-xs hover:bg-primary/95 transition-all shadow-md shadow-primary/20 active:scale-95"
          >
            <Printer size={14} />
            <span>{t.printReport}</span>
          </button>
        </div>
      </div>

      {/* Printable Report Layout Container */}
      <div
        ref={reportRef}
        className="bg-card border border-border/80 rounded-3xl p-6 md:p-10 shadow-xl space-y-8 relative overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black print:p-0"
      >
        {/* Print Only Disclaimer */}
        <div className="hidden print:block text-center border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold">VITALPREDICT CLINICAL SUMMARY</h1>
          <p className="text-xs text-slate-500">Explainable Decision Support Platform • HIPAA Protected Data</p>
        </div>

        {/* Top Decorative Border for Screen */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-purple-500 to-pink-500 print:hidden"></div>

        {/* Section 1: Header Patient Summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6 print:border-slate-300">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-primary font-mono tracking-widest uppercase bg-primary/10 px-2 py-0.5 rounded border border-primary/20 print:text-black print:border-slate-300">
              PATIENT SUMMARY REPORT
            </span>
            <h3 className="text-xl font-bold">{name || 'User'}</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-semibold print:text-slate-600">
              <span>Age: {healthData.age} Yrs</span>
              <span>•</span>
              <span>Gender: {healthData.gender === 'male' ? 'Male' : 'Female'}</span>
              <span>•</span>
              <span>Height: {healthData.height} cm</span>
              <span>•</span>
              <span>Weight: {healthData.weight} kg</span>
            </div>
          </div>

          <div className="text-left md:text-right space-y-1">
            <p className="text-xs text-muted-foreground font-medium print:text-slate-500">Document UUID</p>
            <p className="text-xs font-mono font-bold">VP-2026-90412-R</p>
            <p className="text-xs text-muted-foreground print:text-slate-500">Generated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Section 2: Clinical Risk Matrix */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 print:text-black">
            <ClipboardList size={13} className="text-primary print:text-black" /> Clinical Score Matrix
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Health Score */}
            <div className="p-4 bg-secondary/35 border border-border/40 rounded-2xl print:bg-slate-100 print:border-slate-300">
              <p className="text-[10px] text-muted-foreground font-bold uppercase print:text-slate-500">Overall Health</p>
              <p className="text-2xl font-black font-mono text-primary mt-1 print:text-black">{currentScores.overallHealth}/100</p>
              <span className="text-[9px] text-muted-foreground leading-none mt-1 inline-block">Predictive wellness baseline</span>
            </div>

            {/* Heart Risk */}
            <div className="p-4 bg-secondary/35 border border-border/40 rounded-2xl print:bg-slate-100 print:border-slate-300">
              <p className="text-[10px] text-muted-foreground font-bold uppercase print:text-slate-500">Heart Event Risk</p>
              <p className="text-2xl font-black font-mono text-pink-500 mt-1 print:text-black">{currentScores.heartRisk}%</p>
              <span className="text-[9px] text-muted-foreground leading-none mt-1 inline-block">Attributed vascular strain</span>
            </div>

            {/* Diabetes Risk */}
            <div className="p-4 bg-secondary/35 border border-border/40 rounded-2xl print:bg-slate-100 print:border-slate-300">
              <p className="text-[10px] text-muted-foreground font-bold uppercase print:text-slate-500">Diabetes Risk</p>
              <p className="text-2xl font-black font-mono text-indigo-400 mt-1 print:text-black">{currentScores.diabetesRisk}%</p>
              <span className="text-[9px] text-muted-foreground leading-none mt-1 inline-block">Attributed insulin sensitivity</span>
            </div>

            {/* Neuro-stress Index */}
            <div className="p-4 bg-secondary/35 border border-border/40 rounded-2xl print:bg-slate-100 print:border-slate-300">
              <p className="text-[10px] text-muted-foreground font-bold uppercase print:text-slate-500">Stress Index</p>
              <p className="text-2xl font-black font-mono text-amber-500 mt-1 print:text-black">{currentScores.stressScore}/100</p>
              <span className="text-[9px] text-muted-foreground leading-none mt-1 inline-block">Adrenal response loading</span>
            </div>
          </div>
        </div>

        {/* Section 3: Vitals & Lab Biomarkers */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 print:text-black">
            <Activity size={13} className="text-primary print:text-black" /> Physiologic Vitals & Biomarkers
          </h4>

          <div className="bg-secondary/20 border border-border/40 rounded-2xl p-4 print:bg-transparent print:border-slate-300">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-semibold print:text-slate-500">Blood Pressure</p>
                <p className="text-base font-bold font-mono">{healthData.bpSystolic}/{healthData.bpDiastolic} mmHg</p>
                <span className="text-[9px] text-amber-500 font-bold">Stage 1 Hypertensive</span>
              </div>
              
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-semibold print:text-slate-500">Fasting Glucose</p>
                <p className="text-base font-bold font-mono">{healthData.glucose} mg/dL</p>
                <span className="text-[9px] text-violet-400 font-bold">Impaired Fasting</span>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-semibold print:text-slate-500">Resting Heart Rate</p>
                <p className="text-base font-bold font-mono">{healthData.heartRate} BPM</p>
                <span className="text-[9px] text-emerald-400 font-bold">Normal sinus rhythm</span>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-semibold print:text-slate-500">BMI Metric</p>
                <p className="text-base font-bold font-mono">{bmi.toFixed(1)} kg/m²</p>
                <span className="text-[9px] text-violet-400 font-bold">Overweight threshold</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Explainable SHAP Risk Drivers */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 print:text-black">
            <Brain size={13} className="text-primary print:text-black" /> SHAP Feature Attribution (Primary Risk Drivers)
          </h4>
          
          <div className="space-y-2 text-xs leading-normal">
            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start space-x-3 print:bg-transparent print:border-slate-300">
              <span className="text-red-400 shrink-0 font-bold mt-0.5 font-mono text-[10px]">[Vascular Drive]</span>
              <div>
                <p className="font-bold print:text-black">Systolic Blood Pressure (138 mmHg) & Smoking status</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 print:text-slate-600">
                  Game-theoretic models identify active smoking and elevated systolic blood pressure as the highest positive contributors to overall cardiac event risks, representing a combined +35% relative weight amplification.
                </p>
              </div>
            </div>

            <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start space-x-3 print:bg-transparent print:border-slate-300">
              <span className="text-indigo-400 shrink-0 font-bold mt-0.5 font-mono text-[10px]">[Metabolic Drive]</span>
              <div>
                <p className="font-bold print:text-black">Fasting Serum Glucose (114 mg/dL)</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 print:text-slate-600">
                  Glucose is the single largest driver of your diabetes onset probability, contributing a +28% positive risk offset. Combined with lack of regular aerobic exercise, cellular sensitivity index is moderately depressed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Prioritized Recommendations */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 print:text-black">
            <CheckCircle size={13} className="text-primary print:text-black" /> Actionable Recommendations
          </h4>

          <div className="space-y-3">
            {recommendations.slice(0, 3).map((rec) => (
              <div key={rec.id} className="p-3.5 bg-secondary/35 border border-border/40 rounded-2xl space-y-2 print:border-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-pink-500 border border-pink-500/25 px-2 py-0.5 rounded-full uppercase print:text-black print:border-slate-400">
                    {rec.priority} Priority
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">Model Confidence: {rec.confidenceScore}%</span>
                </div>
                <h5 className="text-xs font-bold">{rec.title}</h5>
                <p className="text-[11px] text-muted-foreground leading-relaxed print:text-slate-700">
                  {rec.description}
                </p>
                <p className="text-[10px] text-indigo-400 font-semibold print:text-slate-800">
                  Expected Impact: {rec.expectedImpact}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Patient Comments & Notes */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 print:text-black">
            <ClipboardList size={13} className="text-primary print:text-black" /> Patient Intake Notes
          </h4>

          <div className="print:hidden">
            <textarea
              value={patientNotes}
              onChange={(e) => setPatientNotes(e.target.value)}
              className="w-full bg-secondary/35 border border-border/80 rounded-2xl p-4 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground min-h-[80px]"
              placeholder="Enter details about your symptoms or medical questions here..."
            />
          </div>
          
          <div className="hidden print:block text-xs text-slate-700 bg-slate-100 border p-4 rounded-xl">
            "{patientNotes}"
          </div>
        </div>

        {/* Section 7: Suggested Discussion Questions */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 print:text-black">
            <HelpCircle size={13} className="text-primary print:text-black" /> Suggested Questions for Your Physician
          </h4>

          <div className="space-y-2 pl-4 list-decimal text-xs text-muted-foreground print:text-slate-700">
            {doctorQuestions.map((q, idx) => (
              <div key={idx} className="flex space-x-2 items-start py-0.5">
                <span className="font-bold font-mono text-primary print:text-black shrink-0">{idx + 1}.</span>
                <p className="leading-relaxed">{q}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer Footer */}
        <div className="border-t border-border/40 pt-4 text-[10px] text-muted-foreground leading-normal flex items-center justify-between print:text-slate-500 print:border-slate-300">
          <span className="flex items-center gap-1.5">
            <Shield size={12} /> Confidential Medical Record • VitalPredict Support Platform
          </span>
          <span>Engine v1.2</span>
        </div>

      </div>

    </div>
  );
};
