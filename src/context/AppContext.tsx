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
  username: string | null;
  name: string | null;
  setSession: (username: string, name: string) => void;
  logout: () => void;
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
  vitalsHistory: any[];
  doctorQuestions: string[];
  patientNotes: string;
  setPatientNotes: (notes: string) => void;
}

const defaultHealthData: HealthData = {
  age: 45,
  gender: 'male',
  height: 172,
  weight: 75,
  bpSystolic: 120,
  bpDiastolic: 80,
  glucose: 95,
  heartRate: 72,
  sleepDuration: 7.5,
  stressLevel: 4,
  dailySteps: 7500,
  exerciseFrequency: 3,
  smoking: 'non-smoker',
  alcohol: 'none',
  familyHistory: 'no',
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
  
  // Persist session via localStorage
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('vp_username'));
  const [name, setName] = useState<string | null>(() => localStorage.getItem('vp_name'));
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!localStorage.getItem('vp_username'));

  const [healthData, setHealthData] = useState<HealthData>(defaultHealthData);
  const [simParameters, setSimParameters] = useState<SimParameters>(defaultSimParameters);
  const [simulatedScores, setSimulatedScores] = useState<HealthScores | null>(null);
  const [patientNotes, setPatientNotes] = useState<string>('');

  const [currentScores, setCurrentScores] = useState<HealthScores>(() => calculateRiskScores(defaultHealthData));
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<HealthTimelineEvent[]>([]);
  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);

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

  // Fetch user profile and timeline snapshots reactively
  useEffect(() => {
    if (!isLoggedIn || !username) {
      setHealthData(defaultHealthData);
      setCurrentScores(calculateRiskScores(defaultHealthData));
      setRecommendations([]);
      setTimelineEvents([]);
      setVitalsHistory([]);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/health-data?username=${encodeURIComponent(username)}`);
        if (response.ok) {
          const data = await response.json();
          setHealthData(data.healthData);
          setCurrentScores(data.currentScores);
          setRecommendations(data.recommendations);
        }
      } catch (err) {
        console.error("Failed to fetch initial health data:", err);
      }
    };

    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/history?username=${encodeURIComponent(username)}`);
        if (response.ok) {
          const historyLogs = await response.json();
          setVitalsHistory(historyLogs);
          // Map database logs to timeline events
          const mappedEvents = historyLogs.map((log: any, index: number) => ({
            id: `log-${log.id}`,
            date: new Date(log.recorded_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            title: index === historyLogs.length - 1 ? "Latest Vitals Recorded" : "Historical Vitals Sync",
            description: `BP: ${log.bp} mmHg, Glucose: ${log.glucose} mg/dL, Weight: ${log.weight} kg. Overall Health Score: ${log.scores?.overallHealth || 0}/100.`,
            type: (log.scores?.overallHealth || 0) > 80 ? 'improvement' : 'stable',
            icon: (log.scores?.overallHealth || 0) > 80 ? 'CheckCircle' : 'Activity'
          }));
          
          setTimelineEvents(mappedEvents.reverse());
        }
      } catch (err) {
        console.error("Failed to fetch history logs:", err);
      }
    };

    fetchData();
    fetchHistory();

    // WebSocket connect
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const socket = new WebSocket(`${wsProtocol}//${wsHost}/ws/vitals`);

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'VITALS_UPDATE' && payload.username === username) {
          console.log("Real-time vitals update received over WebSocket:", payload);
          setHealthData(payload.healthData);
          setCurrentScores(payload.currentScores);
          setRecommendations(payload.recommendations);
          
          // Re-fetch timeline history to capture the newly added log
          fetchHistory();
        }
      } catch (err) {
        console.error("Error parsing WebSocket payload:", err);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket connection error:", error);
    };

    return () => {
      socket.close();
    };
  }, [isLoggedIn, username]);

  const setSession = (uname: string, displayName: string) => {
    localStorage.setItem('vp_username', uname);
    localStorage.setItem('vp_name', displayName);
    setUsername(uname);
    setName(displayName);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem('vp_username');
    localStorage.removeItem('vp_name');
    setUsername(null);
    setName(null);
    setIsLoggedIn(false);
  };

  // Post changes to backend API
  const updateHealthDataOnBackend = async (newData: HealthData) => {
    if (!username) return;
    try {
      const response = await fetch(`/api/health-data?username=${encodeURIComponent(username)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newData)
      });
      if (response.ok) {
        const payload = await response.json();
        setHealthData(payload.healthData);
        setCurrentScores(payload.currentScores);
        setRecommendations(payload.recommendations);
      }
    } catch (err) {
      console.error("Failed to save health data on backend:", err);
    }
  };

  // Run What-If Counterfactual Simulation
  const runSimulation = () => {
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

  // Dynamic doctor questions based on patient anomalies
  const getDoctorQuestions = (): string[] => {
    const q: string[] = [];
    if (healthData.bpSystolic > 130 || healthData.bpDiastolic > 85) {
      q.push(`My blood pressure is ${healthData.bpSystolic}/${healthData.bpDiastolic} mmHg. Is pharmacological therapy needed, or can lifestyle changes manage this over the next 3 months?`);
    }
    if (healthData.familyHistory === 'yes') {
      q.push("Given my family history of heart disease, how much of my cardiac risk score is genetic versus modifiable through lifestyle changes?");
    }
    if (healthData.stressLevel > 6) {
      q.push(`My stress level is ${healthData.stressLevel}/10. Are there specific breathing techniques, beta-blockers, or interventions you recommend to prevent autonomic BP spikes?`);
    }
    if (healthData.glucose > 100) {
      q.push(`With a fasting glucose of ${healthData.glucose} mg/dL, should we run an HbA1c test to confirm pre-diabetic thresholds?`);
    }
    if (healthData.smoking === 'smoker') {
      q.push("What smoking cessation support structures or prescription aids (like Chantix or Zyban) would be most suitable for my physiological profile?");
    }
    if (healthData.sleepDuration < 6) {
      q.push(`I'm averaging only ${healthData.sleepDuration} hours of sleep. Could this be contributing to elevated cortisol or hypertension, and what interventions would help?`);
    }
    if (q.length === 0) {
      q.push("What key vitals should I track most closely given my current health profile?");
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
        username,
        name,
        setSession,
        logout,
        healthData,
        setHealthData: updateHealthDataOnBackend,
        simParameters,
        setSimParameters,
        currentScores,
        simulatedScores,
        runSimulation,
        resetSimulation,
        recommendations,
        timelineEvents,
        vitalsHistory,
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
