import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, HealthData } from '../context/AppContext';
import { translations } from '../data/translations';
import {
  User,
  Heart,
  Activity,
  Shield,
  Save,
  RotateCcw,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const HealthInput: React.FC = () => {
  const { language, healthData, setHealthData } = useApp();
  const navigate = useNavigate();
  const t = translations[language] || translations.en;

  // Local state for form fields to support "Reset" and avoid laggy typing
  const [formData, setFormData] = useState<HealthData>({ ...healthData });
  const [showToast, setShowToast] = useState(false);
  const [bmi, setBmi] = useState<number>(0);
  const [bmiStatus, setBmiStatus] = useState<{ text: string; color: string }>({ text: '', color: '' });

  // Recalculate BMI dynamically when height or weight changes
  useEffect(() => {
    if (formData.height > 0 && formData.weight > 0) {
      const calculatedBmi = formData.weight / Math.pow(formData.height / 100, 2);
      setBmi(calculatedBmi);

      if (calculatedBmi < 18.5) {
        setBmiStatus({ text: 'Underweight', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' });
      } else if (calculatedBmi < 25) {
        setBmiStatus({ text: 'Normal Weight', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' });
      } else if (calculatedBmi < 30) {
        setBmiStatus({ text: 'Overweight', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' });
      } else {
        setBmiStatus({ text: 'Obese', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' });
      }
    }
  }, [formData.height, formData.weight]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Parse numeric fields properly
    let parsedValue: string | number = value;
    if (type === 'number' || name === 'sleepDuration' || name === 'exerciseFrequency' || name === 'stressLevel' || name === 'dailySteps' || name === 'bpSystolic' || name === 'bpDiastolic' || name === 'glucose' || name === 'heartRate' || name === 'age') {
      parsedValue = parseFloat(value);
      if (isNaN(parsedValue)) parsedValue = 0;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setHealthData(formData);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleReset = () => {
    setFormData({ ...healthData });
  };

  const handlePreview = () => {
    setHealthData(formData);
    navigate('/brief');
  };

  return (
    <div className="space-y-6 relative max-w-4xl mx-auto">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center space-x-3 bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-xl animate-bounce">
          <CheckCircle size={18} />
          <span className="text-xs font-bold font-sans">Health profile updated successfully! Explanatory parameters rebuilt.</span>
        </div>
      )}

      {/* Header Description */}
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight">{t.healthInput}</h2>
        <p className="text-sm text-muted-foreground">
          Fill in your current health metrics. The explainable AI core recalculates your scores and recommendations instantly.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* SECTION 1: Personal Information */}
        <div className="bg-card/45 backdrop-blur-md border border-border/60 rounded-2xl p-5 md:p-6 shadow-lg space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 border-b border-border/40 pb-2">
            <User size={16} /> {t.personalInfo}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Age */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">{t.age}</label>
              <input
                type="number"
                name="age"
                required
                min="1"
                max="120"
                value={formData.age}
                onChange={handleChange}
                className="w-full bg-secondary/35 border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">{t.gender}</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-secondary/35 border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
              >
                <option value="male" className="bg-card">{t.male}</option>
                <option value="female" className="bg-card">{t.female}</option>
              </select>
            </div>

            {/* Height */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">{t.height}</label>
              <input
                type="number"
                name="height"
                required
                min="50"
                max="250"
                value={formData.height}
                onChange={handleChange}
                className="w-full bg-secondary/35 border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Weight */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">{t.weight}</label>
              <input
                type="number"
                name="weight"
                required
                min="20"
                max="300"
                value={formData.weight}
                onChange={handleChange}
                className="w-full bg-secondary/35 border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* BMI Display (Calculated) */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">{t.bmi} (Auto-Calculated)</label>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  disabled
                  value={bmi.toFixed(1)}
                  className="bg-muted/40 border border-border/80 text-muted-foreground rounded-xl px-3 py-2 text-sm font-semibold font-mono w-24"
                />
                <span className={`text-xs font-bold py-1.5 px-3 rounded-full border ${bmiStatus.color}`}>
                  {bmiStatus.text}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Vital Signs */}
        <div className="bg-card/45 backdrop-blur-md border border-border/60 rounded-2xl p-5 md:p-6 shadow-lg space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 border-b border-border/40 pb-2">
            <Heart size={16} /> {t.vitals}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BP Systolic */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Systolic Blood Pressure (mmHg)</label>
              <input
                type="number"
                name="bpSystolic"
                required
                min="70"
                max="220"
                value={formData.bpSystolic}
                onChange={handleChange}
                className="w-full bg-secondary/35 border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* BP Diastolic */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Diastolic Blood Pressure (mmHg)</label>
              <input
                type="number"
                name="bpDiastolic"
                required
                min="40"
                max="130"
                value={formData.bpDiastolic}
                onChange={handleChange}
                className="w-full bg-secondary/35 border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Fasting Glucose */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">{t.glucose}</label>
              <input
                type="number"
                name="glucose"
                required
                min="50"
                max="400"
                value={formData.glucose}
                onChange={handleChange}
                className="w-full bg-secondary/35 border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Heart Rate */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">{t.heartRate}</label>
              <input
                type="number"
                name="heartRate"
                required
                min="40"
                max="200"
                value={formData.heartRate}
                onChange={handleChange}
                className="w-full bg-secondary/35 border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Lifestyle Factors */}
        <div className="bg-card/45 backdrop-blur-md border border-border/60 rounded-2xl p-5 md:p-6 shadow-lg space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 border-b border-border/40 pb-2">
            <Activity size={16} /> {t.lifestyle}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sleep Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">{t.sleepDuration}</label>
              <input
                type="number"
                name="sleepDuration"
                step="0.1"
                required
                min="2"
                max="16"
                value={formData.sleepDuration}
                onChange={handleChange}
                className="w-full bg-secondary/35 border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Stress Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">{t.stressLevel} (1-10)</label>
              <input
                type="number"
                name="stressLevel"
                required
                min="1"
                max="10"
                value={formData.stressLevel}
                onChange={handleChange}
                className="w-full bg-secondary/35 border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Daily Steps */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Daily Steps</label>
              <input
                type="number"
                name="dailySteps"
                required
                min="0"
                max="50000"
                value={formData.dailySteps}
                onChange={handleChange}
                className="w-full bg-secondary/35 border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Exercise Frequency */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Exercise (Days / Week)</label>
              <input
                type="number"
                name="exerciseFrequency"
                step="0.5"
                required
                min="0"
                max="7"
                value={formData.exerciseFrequency}
                onChange={handleChange}
                className="w-full bg-secondary/35 border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Smoking */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">{t.smoking}</label>
              <select
                name="smoking"
                value={formData.smoking}
                onChange={handleChange}
                className="w-full bg-secondary/35 border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
              >
                <option value="non-smoker" className="bg-card">{t.nonSmoker}</option>
                <option value="smoker" className="bg-card">{t.smoker}</option>
              </select>
            </div>

            {/* Alcohol */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">{t.alcohol}</label>
              <select
                name="alcohol"
                value={formData.alcohol}
                onChange={handleChange}
                className="w-full bg-secondary/35 border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
              >
                <option value="none" className="bg-card">{t.none}</option>
                <option value="moderate" className="bg-card">{t.moderate}</option>
                <option value="high" className="bg-card">{t.high}</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 4: Medical / Family Information */}
        <div className="bg-card/45 backdrop-blur-md border border-border/60 rounded-2xl p-5 md:p-6 shadow-lg space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 border-b border-border/40 pb-2">
            <Shield size={16} /> {t.medicalInfo}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Family Cardiovascular History */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">{t.familyHistory}</label>
              <select
                name="familyHistory"
                value={formData.familyHistory}
                onChange={handleChange}
                className="w-full bg-secondary/35 border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
              >
                <option value="no" className="bg-card">{t.no}</option>
                <option value="yes" className="bg-card">{t.yes}</option>
              </select>
            </div>

            <div className="flex items-center text-xs text-muted-foreground bg-secondary/20 border border-border/30 rounded-xl p-3">
              <AlertCircle className="text-indigo-400 mr-3 shrink-0" size={18} />
              <span>Cardiovascular and metabolic lineage parameters heavily weight baseline weights in classifier engines.</span>
            </div>
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-2 justify-end">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-1.5 border border-border hover:border-primary/50 hover:bg-secondary px-4 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition-all active:scale-95"
          >
            <RotateCcw size={14} />
            <span>{t.reset}</span>
          </button>
          
          <button
            type="button"
            onClick={handlePreview}
            className="flex items-center space-x-1.5 border border-primary/30 hover:border-primary/60 bg-primary/10 text-primary px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-primary/20 transition-all active:scale-95"
          >
            <Eye size={14} />
            <span>{t.preview}</span>
          </button>

          <button
            type="submit"
            className="flex items-center space-x-1.5 bg-gradient-to-r from-primary to-fuchsia-600 hover:from-primary/95 hover:to-fuchsia-600/95 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/20 active:scale-95"
          >
            <Save size={14} />
            <span>{t.save}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
