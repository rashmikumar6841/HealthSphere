import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../data/translations';

// Define the shape of health profile data
export interface HealthData {
  age: number;
  gender: 'male' | 'female';
  height: number; // in cm
  weight: number; // in kg
  bpSystolic: number;
  bpDiastolic: number;
  glucose: number; // mg/dL
  heartRate: number; // bpm
  sleepDuration: number; // hours
  stressLevel: number; // 1-10
  dailySteps: number;
  exerciseFrequency: number; // days/week
  smoking: 'non-smoker' | 'smoker';
  alcohol: 'none' | 'moderate' | 'high';
  familyHistory: 'yes' | 'no';
}

// Define the shape of simulation parameters (What-If)
export interface SimParameters {
  sleep: number; // change in hours
  exercise: number; // change in days/week
  calories: number; // change in kcal/day
  weight: number; // target weight in kg
  stress: number; // stress level (1-10)
  waterIntake: number; // daily water in Liters
}

export interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reason: string;
  expectedImpact: string;
  confidenceScore: number; // percentage
}

export interface HealthTimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'improvement' | 'risk-increase' | 'lifestyle-change' | 'stable';
  icon: string;
}

export interface HealthScores {
  overallHealth: number;
  heartRisk: number; // percentage
  diabetesRisk: number; // percentage
  sleepScore: number; // percentage
  stressScore: number; // percentage
}

interface AppContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (status: boolean) => void;
  healthData: HealthData;
  setHealthData: (data: HealthData) => void;
  simParameters: SimParameters;
  setSimParameters: (params: SimParameters) => void;
  currentScores: HealthScores;
  simulatedScores: HealthScores | null;
  runSimulation: () => void;
  resetSimulation: () => void;
  recommendations: Recommendation[];
  timelineEvents: HealthTimelineEvent[];
  doctorQuestions: string[];
  patientNotes: string;
  setPatientNotes: (notes: string) => void;
}

const defaultHealthData: HealthData = {
  age: 48,
  gender: 'male',
  height: 176,
  weight: 84,
  bpSystolic: 138,
  bpDiastolic: 88,
  glucose: 114,
  heartRate: 78,
  sleepDuration: 5.8,
  stressLevel: 7,
  dailySteps: 4200,
  exerciseFrequency: 1.5,
  smoking: 'smoker',
  alcohol: 'moderate',
  familyHistory: 'yes',
};

const defaultSimParameters: SimParameters = {
  sleep: 7.5, // 7.5 hours
  exercise: 4, // 4 days a week
  calories: 2100, // 2100 kcal
  weight: 76, // target 76 kg
  stress: 4, // Stress level 4
  waterIntake: 2.8, // 2.8 liters
};

const AppContext = createContext<AppContextProps | undefined>(undefined);

// Helper function to calculate health scores reactively
export const calculateRiskScores = (data: HealthData): HealthScores => {
  const bmi = data.weight / Math.pow(data.height / 100, 2);

  // 1. HEART RISK (0-100%)
  let heartPoints = 0;
  if (data.age > 45) heartPoints += 15;
  if (data.age > 60) heartPoints += 10;
  if (data.bpSystolic > 130 || data.bpDiastolic > 85) heartPoints += 20;
  if (data.bpSystolic > 140 || data.bpDiastolic > 90) heartPoints += 15;
  if (data.smoking === 'smoker') heartPoints += 25;
  if (data.alcohol === 'high') heartPoints += 15;
  if (data.familyHistory === 'yes') heartPoints += 20;
  if (bmi > 25) heartPoints += 10;
  if (bmi > 30) heartPoints += 15;
  if (data.dailySteps < 5000) heartPoints += 15;
  if (data.exerciseFrequency < 2) heartPoints += 10;
  // Apply protections
  if (data.exerciseFrequency >= 4) heartPoints -= 10;
  if (data.dailySteps > 10000) heartPoints -= 15;
  const heartRisk = Math.max(5, Math.min(95, heartPoints));

  // 2. DIABETES RISK (0-100%)
  let diabetesPoints = 0;
  if (data.glucose > 100) diabetesPoints += 30; // Prediabetic indicator
  if (data.glucose > 125) diabetesPoints += 35; // Diabetic indicator
  if (bmi > 25) diabetesPoints += 15;
  if (bmi > 30) diabetesPoints += 15;
  if (data.age > 40) diabetesPoints += 10;
  if (data.exerciseFrequency < 2) diabetesPoints += 15;
  if (data.dailySteps < 5000) diabetesPoints += 10;
  if (data.familyHistory === 'yes') diabetesPoints += 10;
  // Protectives
  if (data.exerciseFrequency >= 3) diabetesPoints -= 10;
  const diabetesRisk = Math.max(4, Math.min(98, diabetesPoints));

  // 3. SLEEP SCORE (0-100)
  let sleepVal = 100;
  if (data.sleepDuration < 7) sleepVal -= (7 - data.sleepDuration) * 15;
  if (data.sleepDuration > 9) sleepVal -= (data.sleepDuration - 9) * 10;
  if (data.stressLevel > 5) sleepVal -= (data.stressLevel - 5) * 8;
  if (data.alcohol === 'high') sleepVal -= 15;
  if (data.heartRate > 80) sleepVal -= 5;
  const sleepScore = Math.max(30, Math.min(100, Math.round(sleepVal)));

  // 4. STRESS SCORE (0-100)
  // Input stress level is 1-10, scale to 0-100, adjusting for secondary indicators
  let stressVal = data.stressLevel * 10;
  if (data.sleepDuration < 6) stressVal += 12;
  if (data.exerciseFrequency < 2) stressVal += 8;
  if (data.dailySteps < 4000) stressVal += 5;
  const stressScore = Math.max(10, Math.min(98, stressVal));

  // 5. OVERALL HEALTH SCORE (0-100)
  // Health score is higher when risk factors are lower, and wellness scores are higher
  const averageRisk = (heartRisk + diabetesRisk) / 2;
  const averageWellness = (sleepScore + (100 - stressScore)) / 2;
  const overallHealth = Math.round(100 - (averageRisk * 0.6) + (averageWellness - 50) * 0.3);

  return {
    overallHealth: Math.max(20, Math.min(99, overallHealth)),
    heartRisk: Math.round(heartRisk),
    diabetesRisk: Math.round(diabetesRisk),
    sleepScore: Math.round(sleepScore),
    stressScore: Math.round(stressScore),
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true); // Logged in by default for smoother prototyping
  const [healthData, setHealthData] = useState<HealthData>(defaultHealthData);
  const [simParameters, setSimParameters] = useState<SimParameters>(defaultSimParameters);
  const [simulatedScores, setSimulatedScores] = useState<HealthScores | null>(null);
  const [patientNotes, setPatientNotes] = useState<string>(
    "I have been feeling slightly fatigued in the afternoons, and I notice my chest feels slightly tight when climbing stairs. I'm trying to improve my lifestyle but finding it hard to stay consistent."
  );

  const [currentScores, setCurrentScores] = useState<HealthScores>(() => calculateRiskScores(defaultHealthData));

  // Sync theme with DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [theme]);

  // Recalculate baseline scores whenever healthData changes
  useEffect(() => {
    setCurrentScores(calculateRiskScores(healthData));
  }, [healthData]);

  // Run What-If Counterfactual Simulation
  const runSimulation = () => {
    // Generate simulated data by applying slider changes to original health data
    // Compute target weight change, exercise change, sleep change, and stress level change
    const simulatedData: HealthData = {
      ...healthData,
      weight: simParameters.weight, // sets weight directly
      sleepDuration: simParameters.sleep, // sets sleep directly
      exerciseFrequency: simParameters.exercise, // sets exercise frequency
      stressLevel: simParameters.stress, // sets stress
      dailySteps: Math.max(healthData.dailySteps, healthData.dailySteps + (simParameters.exercise - healthData.exerciseFrequency) * 1500),
      glucose: Math.max(75, healthData.glucose - (simParameters.exercise - healthData.exerciseFrequency) * 4 - (healthData.weight - simParameters.weight) * 2),
      bpSystolic: Math.max(105, healthData.bpSystolic - (simParameters.exercise - healthData.exerciseFrequency) * 2 - (healthData.weight - simParameters.weight) * 1.5 - (simParameters.sleep - healthData.sleepDuration) * 1.2),
      bpDiastolic: Math.max(65, healthData.bpDiastolic - (simParameters.exercise - healthData.exerciseFrequency) * 1.2 - (healthData.weight - simParameters.weight) * 1 - (simParameters.sleep - healthData.sleepDuration) * 0.8),
    };

    setSimulatedScores(calculateRiskScores(simulatedData));
  };

  const resetSimulation = () => {
    setSimParameters({
      sleep: healthData.sleepDuration,
      exercise: healthData.exerciseFrequency,
      calories: 2200,
      weight: healthData.weight,
      stress: healthData.stressLevel,
      waterIntake: 2.5,
    });
    setSimulatedScores(null);
  };

  // Recommendations based dynamically on healthData
  const getRecommendations = (): Recommendation[] => {
    const recs: Recommendation[] = [];
    const bmi = healthData.weight / Math.pow(healthData.height / 100, 2);

    if (healthData.bpSystolic > 135 || healthData.bpDiastolic > 85) {
      recs.push({
        id: 'rec-bp',
        priority: 'high',
        title: 'Manage Elevated Blood Pressure',
        description: 'Adopt the DASH (Dietary Approaches to Stop Hypertension) diet and reduce sodium intake below 1,500 mg per day.',
        reason: `Your blood pressure is currently ${healthData.bpSystolic}/${healthData.bpDiastolic} mmHg. Explainable ML mapping attributes 25% of your Heart Risk directly to hypertension factors.`,
        expectedImpact: 'Estimated reduction of 8-12 mmHg systolic and up to 15% reduction in cardiovascular event risk within 6 weeks.',
        confidenceScore: 92,
      });
    }

    if (healthData.smoking === 'smoker') {
      recs.push({
        id: 'rec-smoke',
        priority: 'high',
        title: 'Initiate Smoking Cessation Program',
        description: 'Integrate nicotine replacement therapy (NRT) or consult a physician for pharmacological aids like varenicline.',
        reason: 'Active smoking is identified as the single largest preventable contributor to your arterial stiffness and heart risk calculation.',
        expectedImpact: 'Immediate 20% drops in heart rate risk within 48 hours; up to 50% decrease in heart disease risk at 1 year.',
        confidenceScore: 97,
      });
    }

    if (healthData.glucose > 100) {
      recs.push({
        id: 'rec-diab',
        priority: 'high',
        title: 'Stabilize Fasting Blood Glucose',
        description: 'Minimize refined carbohydrates and simple sugars. Incorporate strength training to increase insulin sensitivity.',
        reason: `Your blood glucose is ${healthData.glucose} mg/dL, putting you in the pre-diabetic risk window. AI explanations link this with weight and lack of daily exercise.`,
        expectedImpact: 'Reversion of fasting blood sugar to <99 mg/dL and a 42% reduction in diabetes onset risk.',
        confidenceScore: 89,
      });
    }

    if (bmi > 25) {
      recs.push({
        id: 'rec-weight',
        priority: 'medium',
        title: 'Gradual Weight Optimization',
        description: 'Target a calorie deficit of 300-500 kcal per day through consistent activity and portion control.',
        reason: `Your BMI is ${bmi.toFixed(1)} (${bmi > 30 ? 'Obese' : 'Overweight'}). Weight acts as an amplifier for both vascular pressure and cellular insulin resistance.`,
        expectedImpact: 'Reaching a BMI of 24.0 will lower systolic BP by 6 mmHg and raise daily sleep quality indicators.',
        confidenceScore: 85,
      });
    }

    if (healthData.sleepDuration < 7) {
      recs.push({
        id: 'rec-sleep',
        priority: 'medium',
        title: 'Sleep Hygiene Protocols',
        description: 'Maintain a strict bedtime routine. Limit screen time and blue light exposure at least 60 minutes before sleeping.',
        reason: `Your sleep of ${healthData.sleepDuration}h is below the physiological baseline of 7.2h, spiking cortisol production and stress markers.`,
        expectedImpact: 'Stabilizing sleep at 7.5h will decrease overall stress score by 20% and reduce vascular resistance.',
        confidenceScore: 88,
      });
    }

    if (healthData.dailySteps < 6000) {
      recs.push({
        id: 'rec-steps',
        priority: 'medium',
        title: 'Increase Daily Physical Activity',
        description: 'Implement two 15-minute walking sessions during the day, aiming for at least 8,000 steps.',
        reason: 'Low steps reduce active metabolic rate and contribute to elevated cardiovascular risk indices.',
        expectedImpact: 'Increases heart rate variability (HRV), lowers resting HR, and decreases heart risk scores.',
        confidenceScore: 91,
      });
    }

    // Default recommendation if healthy
    if (recs.length === 0) {
      recs.push({
        id: 'rec-health',
        priority: 'low',
        title: 'Maintain Active Lifestyle',
        description: 'Continue your excellent exercise regime and clean diet. Consider adding cardiovascular endurance sessions.',
        reason: 'Your metrics are within healthy limits, keep up the prevention-focused habits.',
        expectedImpact: 'Maintenance of overall health score above 90.',
        confidenceScore: 95,
      });
    }

    return recs;
  };

  // Timeline events showing explainable progression
  const getTimelineEvents = (): HealthTimelineEvent[] => [
    {
      id: 't1',
      date: 'June 1, 2026',
      title: 'Sleep Duration Reduced',
      description: 'Sleep duration average decreased from 7.1h to 5.8h due to work project deadlines.',
      type: 'lifestyle-change',
      icon: 'Moon',
    },
    {
      id: 't2',
      date: 'June 5, 2026',
      title: 'Stress Level Increased',
      description: 'Stress index climbed from 4 to 7, strongly correlated with sleep reduction and high resting HR.',
      type: 'risk-increase',
      icon: 'Activity',
    },
    {
      id: 't3',
      date: 'June 12, 2026',
      title: 'Blood Pressure Elevated',
      description: 'Systolic blood pressure rose to 138 mmHg. Explainer engine attributes this to elevated cortisol levels.',
      type: 'risk-increase',
      icon: 'Heart',
    },
    {
      id: 't4',
      date: 'June 18, 2026',
      title: 'Cardiovascular Risk Increase',
      description: 'Calculated Heart Risk rose by 12% following sustained pressure and low daily steps.',
      type: 'risk-increase',
      icon: 'TrendingUp',
    },
    {
      id: 't5',
      date: 'June 25, 2026',
      title: 'Sleep Quality Restored',
      description: 'Implemented sleep routines, restoring sleep duration back to 7.2 hours.',
      type: 'improvement',
      icon: 'Smile',
    },
    {
      id: 't6',
      date: 'June 30, 2026',
      title: 'Stress & Risk Deflection',
      description: 'Stress index fell by 15% and Blood Pressure decreased to 126/82 mmHg, dragging down Heart Risk.',
      type: 'improvement',
      icon: 'CheckCircle',
    },
  ];

  // Dynamic doctor questions based on patient anomalies
  const getDoctorQuestions = (): string[] => {
    const q = [
      "Is my current blood pressure reading (systolic 138) high enough to consider pharmacological therapy, or can I try lifestyle management for 3 more months?",
      "How much of my cardiac risk score is attributed to my family history of heart disease versus active smoking?",
      "I notice my stress level directly spikes my blood pressure in the logs. Are there specific beta-blockers or natural breathing techniques you suggest for quick heart-rate spikes?"
    ];
    if (healthData.glucose > 100) {
      q.push("With a fasting glucose of " + healthData.glucose + " mg/dL, should we run an HbA1c test to confirm pre-diabetic thresholds?");
    }
    if (healthData.smoking === 'smoker') {
      q.push("What smoking cessation support structures or prescription aids (like Chantix or Zyban) would be most suitable for my physiological profile?");
    }
    return q;
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        setTheme,
        isLoggedIn,
        setIsLoggedIn,
        healthData,
        setHealthData,
        simParameters,
        setSimParameters,
        currentScores,
        simulatedScores,
        runSimulation,
        resetSimulation,
        recommendations: getRecommendations(),
        timelineEvents: getTimelineEvents(),
        doctorQuestions: getDoctorQuestions(),
        patientNotes,
        setPatientNotes,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
