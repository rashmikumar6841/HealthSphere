// VitalPredict Core Architecture Services Simulator
// Simulates the backend pipeline stages: Data Ingestion, Processing, ML & XAI Core, Database Storage, and Passport Version Control.

import { HealthData, HealthScores } from '../context/AppContext';

// ==========================================
// 1. DATA SOURCES & ACQUISITION
// ==========================================

export interface RawDataSourceInput {
  sourceType: 'wearable' | 'electronic_record' | 'lab_report' | 'nutrition_log';
  timestamp: string;
  rawData: string; // JSON or free-text raw data
}

export interface IngestedData {
  isValid: boolean;
  errors: string[];
  cleanedData: Partial<HealthData>;
  logs: string[];
}

export interface FeatureVector {
  // Original features
  age: number;
  bmi: number;
  glucose: number;
  bpSystolic: number;
  bpDiastolic: number;
  sleepDuration: number;
  stressLevel: number;
  dailySteps: number;
  exerciseFrequency: number;
  // Engineered features
  pulsePressure: number; // bpSystolic - bpDiastolic
  meanArterialPressure: number; // diastolic + (pulsePressure / 3)
  sleepToStressRatio: number; // sleepDuration / (stressLevel || 1)
  cardioMetabolicIndex: number; // (glucose * bmi) / 100
}

export const runDataPipeline = (input: RawDataSourceInput): IngestedData => {
  const logs: string[] = [];
  const errors: string[] = [];
  let cleanedData: Partial<HealthData> = {};
  
  logs.push(`[Ingestion] Initiated pipeline for source: ${input.sourceType.toUpperCase()}`);
  logs.push(`[Ingestion] Timestamp: ${input.timestamp}`);
  
  try {
    const parsed = JSON.parse(input.rawData);
    logs.push(`[Validation] Schema parsing successful. Starting data type validation...`);
    
    // Ingest Wearable Data
    if (input.sourceType === 'wearable') {
      const steps = Number(parsed.steps || parsed.dailySteps || 0);
      const hr = Number(parsed.heartRate || parsed.pulse || 72);
      const sleep = Number(parsed.sleepDuration || parsed.sleep_hours || 0);
      const stress = Number(parsed.stressLevel || parsed.stress || 5);
      
      if (steps < 0 || steps > 100000) errors.push('Steps value out of physiological bounds.');
      if (hr < 30 || hr > 220) errors.push('Heart rate out of physiological bounds.');
      if (sleep < 0 || sleep > 24) errors.push('Sleep duration out of temporal bounds.');
      if (stress < 1 || stress > 10) errors.push('Stress level must be between 1 and 10.');
      
      cleanedData = { dailySteps: steps, heartRate: hr, sleepDuration: sleep, stressLevel: stress };
      logs.push(`[Validation] Validated Wearable variables: Steps=${steps}, HR=${hr}, Sleep=${sleep}h, Stress=${stress}/10`);
    }
    
    // Ingest Electronic Medical Record
    else if (input.sourceType === 'electronic_record') {
      const age = Number(parsed.age || 0);
      const gender = parsed.gender === 'male' || parsed.gender === 'female' ? parsed.gender : 'male';
      const height = Number(parsed.height || 0);
      const weight = Number(parsed.weight || 0);
      const smoking = parsed.smoking === 'smoker' || parsed.smoking === 'non-smoker' ? parsed.smoking : 'non-smoker';
      const alcohol = parsed.alcohol === 'none' || parsed.alcohol === 'moderate' || parsed.alcohol === 'high' ? parsed.alcohol : 'none';
      const familyHistory = parsed.familyHistory === 'yes' || parsed.familyHistory === 'no' ? parsed.familyHistory : 'no';
      
      if (age < 0 || age > 120) errors.push('Age out of normal bounds.');
      if (height < 50 || height > 250) errors.push('Height out of bounds.');
      if (weight < 20 || weight > 300) errors.push('Weight out of bounds.');
      
      cleanedData = { age, gender, height, weight, smoking, alcohol, familyHistory };
      logs.push(`[Validation] Validated EMR variables: Age=${age}, Gender=${gender}, Height=${height}cm, Weight=${weight}kg`);
    }
    
    // Ingest Lab Report
    else if (input.sourceType === 'lab_report') {
      const glucose = Number(parsed.glucose || parsed.blood_sugar || 100);
      
      // Parse composite Blood Pressure strings (e.g. "135/85")
      let bpSystolic = 120;
      let bpDiastolic = 80;
      if (parsed.bloodPressure && typeof parsed.bloodPressure === 'string') {
        const parts = parsed.bloodPressure.split('/');
        if (parts.length === 2) {
          bpSystolic = parseInt(parts[0], 10);
          bpDiastolic = parseInt(parts[1], 10);
          logs.push(`[Data Cleaning] Split composite Blood Pressure string "${parsed.bloodPressure}" into Systolic: ${bpSystolic}, Diastolic: ${bpDiastolic}`);
        } else {
          errors.push('Blood pressure string format invalid (expected Systolic/Diastolic).');
        }
      } else {
        bpSystolic = Number(parsed.bpSystolic || 120);
        bpDiastolic = Number(parsed.bpDiachol || parsed.bpDiastolic || 80);
      }
      
      if (glucose < 20 || glucose > 800) errors.push('Blood glucose out of physiological bounds.');
      if (bpSystolic < 50 || bpSystolic > 260) errors.push('Systolic BP out of bounds.');
      if (bpDiastolic < 30 || bpDiastolic > 160) errors.push('Diastolic BP out of bounds.');
      
      cleanedData = { glucose, bpSystolic, bpDiastolic };
      logs.push(`[Validation] Validated Lab variables: Glucose=${glucose}mg/dL, BP=${bpSystolic}/${bpDiastolic}`);
    }
    
    // Ingest Nutrition Log
    else if (input.sourceType === 'nutrition_log') {
      const alcohol = parsed.alcoholConsumption || 'none';
      const exerciseFrequency = Number(parsed.exerciseFrequency || 0);
      
      cleanedData = { alcohol, exerciseFrequency };
      logs.push(`[Validation] Validated Nutrition variables: Alcohol=${alcohol}, ExerciseFreq=${exerciseFrequency} days/wk`);
    }
    
  } catch (err) {
    errors.push('Failed to parse input raw data as JSON.');
    logs.push('[Error] JSON Parse error encountered.');
  }
  
  if (errors.length > 0) {
    logs.push(`[Cleaning] Data acquisition FAILED with ${errors.length} validation errors.`);
    return { isValid: false, errors, cleanedData: {}, logs };
  }
  
  logs.push(`[Normalization] Normalizing features: computed MinMax Z-score weights...`);
  logs.push(`[Feature Engineering] Running feature calculations...`);
  
  return { isValid: true, errors: [], cleanedData, logs };
};

export const computeFeatureVector = (data: HealthData): FeatureVector => {
  const bmi = data.weight / Math.pow(data.height / 100, 2);
  const pulsePressure = data.bpSystolic - data.bpDiastolic;
  const meanArterialPressure = data.bpDiastolic + (pulsePressure / 3);
  const sleepToStressRatio = data.sleepDuration / (data.stressLevel || 1);
  const cardioMetabolicIndex = (data.glucose * bmi) / 100;
  
  return {
    age: data.age,
    bmi,
    glucose: data.glucose,
    bpSystolic: data.bpSystolic,
    bpDiastolic: data.bpDiastolic,
    sleepDuration: data.sleepDuration,
    stressLevel: data.stressLevel,
    dailySteps: data.dailySteps,
    exerciseFrequency: data.exerciseFrequency,
    pulsePressure,
    meanArterialPressure,
    sleepToStressRatio,
    cardioMetabolicIndex
  };
};

// ==========================================
// 2. HEALTH INTELLIGENCE CORE (XAI & ML MODELS)
// ==========================================

export interface SHAPContribution {
  feature: string;
  displayName: string;
  shapValue: number; // positive = risk increase, negative = protective
  originalValue: string;
}

export interface CausalPathStep {
  sourceNode: string;
  targetNode: string;
  relationship: string;
  weight: number;
  description: string;
}

// Generates dynamic SHAP values for Explainable AI
export const calculateSHAPValues = (data: HealthData, modelType: 'heart' | 'diabetes'): SHAPContribution[] => {
  const bmi = data.weight / Math.pow(data.height / 100, 2);
  const contributions: SHAPContribution[] = [];
  
  if (modelType === 'heart') {
    // Baseline risk expectation for heart events: 15%
    // 1. Age
    const ageDiff = data.age - 35;
    contributions.push({
      feature: 'age',
      displayName: 'Patient Age',
      shapValue: ageDiff > 0 ? Number((ageDiff * 0.4).toFixed(2)) : Number((ageDiff * 0.1).toFixed(2)),
      originalValue: `${data.age} yrs`
    });
    
    // 2. Blood Pressure
    const bpStrain = data.bpSystolic - 120 + (data.bpDiastolic - 80);
    contributions.push({
      feature: 'bp',
      displayName: 'Systolic/Diastolic BP',
      shapValue: bpStrain > 0 ? Number((bpStrain * 0.5).toFixed(2)) : Number((bpStrain * 0.2).toFixed(2)),
      originalValue: `${data.bpSystolic}/${data.bpDiastolic} mmHg`
    });
    
    // 3. Smoking
    contributions.push({
      feature: 'smoking',
      displayName: 'Smoking Intake',
      shapValue: data.smoking === 'smoker' ? 18.5 : -2.5,
      originalValue: data.smoking === 'smoker' ? 'Active Smoker' : 'Non-Smoker'
    });
    
    // 4. Family History
    contributions.push({
      feature: 'familyHistory',
      displayName: 'Family Cardio History',
      shapValue: data.familyHistory === 'yes' ? 12.0 : -4.0,
      originalValue: data.familyHistory === 'yes' ? 'Positive History' : 'No History'
    });
    
    // 5. Daily Steps / Activity
    const stepDiff = data.dailySteps - 7500;
    contributions.push({
      feature: 'dailySteps',
      displayName: 'Daily Walk Steps',
      shapValue: stepDiff > 0 ? Number((-stepDiff * 0.0015).toFixed(2)) : Number((-stepDiff * 0.0025).toFixed(2)),
      originalValue: `${data.dailySteps} steps`
    });
    
    // 6. Sleep Duration
    const sleepDiff = data.sleepDuration - 7.0;
    contributions.push({
      feature: 'sleepDuration',
      displayName: 'Sleep Restoration',
      shapValue: sleepDiff < 0 ? Number((-sleepDiff * 3.5).toFixed(2)) : -1.2,
      originalValue: `${data.sleepDuration} hrs`
    });
    
    // 7. BMI
    const bmiDiff = bmi - 23.5;
    contributions.push({
      feature: 'bmi',
      displayName: 'Body Weight Index (BMI)',
      shapValue: bmiDiff > 0 ? Number((bmiDiff * 0.9).toFixed(2)) : -0.5,
      originalValue: bmi.toFixed(1)
    });
    
  } else {
    // Model: Diabetes
    // Baseline risk expectation: 12%
    // 1. Fasting Glucose
    const glucDiff = data.glucose - 95;
    contributions.push({
      feature: 'glucose',
      displayName: 'Fasting Blood Glucose',
      shapValue: glucDiff > 0 ? Number((glucDiff * 0.65).toFixed(2)) : Number((glucDiff * 0.15).toFixed(2)),
      originalValue: `${data.glucose} mg/dL`
    });
    
    // 2. BMI
    const bmiDiff = bmi - 23.5;
    contributions.push({
      feature: 'bmi',
      displayName: 'Body Weight Index (BMI)',
      shapValue: bmiDiff > 0 ? Number((bmiDiff * 1.4).toFixed(2)) : -1.0,
      originalValue: bmi.toFixed(1)
    });
    
    // 3. Exercise Frequency
    const execDiff = data.exerciseFrequency - 3.0;
    contributions.push({
      feature: 'exerciseFrequency',
      displayName: 'Active Exercise Days',
      shapValue: execDiff > 0 ? Number((-execDiff * 2.8).toFixed(2)) : Number((-execDiff * 4.0).toFixed(2)),
      originalValue: `${data.exerciseFrequency} days/wk`
    });
    
    // 4. Age
    const ageDiff = data.age - 35;
    contributions.push({
      feature: 'age',
      displayName: 'Patient Age',
      shapValue: ageDiff > 0 ? Number((ageDiff * 0.25).toFixed(2)) : -1.5,
      originalValue: `${data.age} yrs`
    });
    
    // 5. Family History
    contributions.push({
      feature: 'familyHistory',
      displayName: 'Family History Risk',
      shapValue: data.familyHistory === 'yes' ? 8.5 : -1.5,
      originalValue: data.familyHistory === 'yes' ? 'Family History' : 'Negative'
    });
  }
  
  return contributions;
};

// Generates dynamic LIME explanation weights
export const calculateLIMEExplanations = (data: HealthData, modelType: 'heart' | 'diabetes'): Record<string, number> => {
  const shap = calculateSHAPValues(data, modelType);
  const lime: Record<string, number> = {};
  shap.forEach((val) => {
    const weight = val.shapValue * (0.85 + Math.random() * 0.2);
    lime[val.displayName] = Number(weight.toFixed(2));
  });
  return lime;
};

// Causal Root Cause Path Tracer (from inputs to risks)
export const traceRootCausePath = (data: HealthData): CausalPathStep[] => {
  const paths: CausalPathStep[] = [];
  
  // Path 1: Stress-BP Pathway
  if (data.stressLevel > 6) {
    paths.push({
      sourceNode: 'Stress Index',
      targetNode: 'Blood Pressure',
      relationship: 'INDUCED_VASOCONSTRICTION',
      weight: 0.65,
      description: `Sympathetic arousal spikes vascular tension. Cortisol raises arterial compression, contributing directly to current ${data.bpSystolic}/${data.bpDiastolic} mmHg.`
    });
  }
  
  // Path 2: BP-Cardiac Strain
  if (data.bpSystolic > 130) {
    paths.push({
      sourceNode: 'Blood Pressure',
      targetNode: 'Heart Disease Risk',
      relationship: 'MYOCARDIAL_WALL_STRAIN',
      weight: 0.85,
      description: `Sustained high BP of ${data.bpSystolic} mmHg damages endothelial walls, multiplying ischemic event likelihood by 1.6x.`
    });
  }
  
  // Path 3: Weight-Insulin Resistance
  const bmi = data.weight / Math.pow(data.height / 100, 2);
  if (bmi > 25) {
    paths.push({
      sourceNode: 'Adipose Volume (BMI)',
      targetNode: 'Fasting Glucose',
      relationship: 'INSULIN_RECEPTOR_DOWNREGULATION',
      weight: 0.72,
      description: `Elevated body fat (${bmi.toFixed(1)} BMI) downregulates GLUT4 cell receptors, locking blood sugar outside tissues and raising glucose to ${data.glucose} mg/dL.`
    });
  }
  
  // Path 4: Glucose-Diabetes
  if (data.glucose > 100) {
    paths.push({
      sourceNode: 'Fasting Glucose',
      targetNode: 'Diabetes Risk',
      relationship: 'METABOLIC_CELLULAR_LOAD',
      weight: 0.90,
      description: `Sustained serum sugar levels (${data.glucose} mg/dL) place maximum load on pancreatic beta cells, triggering type-2 indicators.`
    });
  }
  
  return paths;
};

// ==========================================
// 3. HYBRID DATABASES & STORAGE
// ==========================================

export interface PGQueryResult {
  columns: string[];
  rows: any[][];
  executionTimeMs: number;
}

// Mock PostgreSQL structured schema & executor
export const runPostgreSQLQuery = (query: string, data: HealthData, scores: HealthScores): PGQueryResult => {
  const clean = query.trim().replace(/\s+/g, ' ').toLowerCase();
  const start = performance.now();
  
  let columns: string[] = [];
  let rows: any[][] = [];
  
  if (clean.includes('from patients')) {
    columns = ['patient_id', 'name', 'age', 'gender', 'height_cm', 'weight_kg', 'smoking'];
    rows = [[1, 'Rashmi', data.age, data.gender, data.height, data.weight, data.smoking]];
  } else if (clean.includes('from vitals_history')) {
    columns = ['record_id', 'recorded_at', 'bp_systolic', 'bp_diastolic', 'glucose_mg_dl', 'heart_rate_bpm'];
    rows = [
      [101, '2026-07-06 08:00', data.bpSystolic - 4, data.bpDiastolic - 2, data.glucose - 5, data.heartRate - 3],
      [102, '2026-07-07 08:00', data.bpSystolic - 2, data.bpDiastolic - 1, data.glucose - 3, data.heartRate - 1],
      [103, '2026-07-08 08:00', data.bpSystolic, data.bpDiastolic, data.glucose, data.heartRate],
      [104, '2026-07-09 08:00', data.bpSystolic + 1, data.bpDiastolic + 1, data.glucose + 2, data.heartRate + 2]
    ];
  } else if (clean.includes('from risk_scores')) {
    columns = ['id', 'overall_score', 'heart_risk_pct', 'diabetes_risk_pct', 'updated_at'];
    rows = [[501, scores.overallHealth, scores.heartRisk, scores.diabetesRisk, '2026-07-10 10:00']];
  } else {
    // Default fallback list of tables
    columns = ['table_name', 'estimated_row_count', 'table_type'];
    rows = [
      ['patients', 1, 'BASE TABLE'],
      ['vitals_history', 248, 'BASE TABLE'],
      ['risk_scores', 56, 'BASE TABLE'],
      ['recommendation_logs', 124, 'BASE TABLE']
    ];
  }
  
  const end = performance.now();
  return { columns, rows, executionTimeMs: Number((end - start).toFixed(2)) };
};

// Mock Neo4j Graph Database node details
export interface Neo4jGraphData {
  nodes: { id: string; label: string; group: 'lifestyle' | 'vital' | 'risk' | 'patient' }[];
  relationships: { source: string; target: string; type: string; weight: number }[];
}

export const getNeo4jGraph = (data: HealthData): Neo4jGraphData => {
  return {
    nodes: [
      { id: 'Rashmi', label: 'Patient (Rashmi)', group: 'patient' },
      { id: 'Sleep', label: `Sleep (${data.sleepDuration}h)`, group: 'lifestyle' },
      { id: 'Stress', label: `Stress (${data.stressLevel}/10)`, group: 'vital' },
      { id: 'Weight', label: `Weight (${data.weight}kg)`, group: 'vital' },
      { id: 'Glucose', label: `Glucose (${data.glucose}mg/dL)`, group: 'vital' },
      { id: 'BP', label: `Blood Pressure (${data.bpSystolic}/${data.bpDiastolic})`, group: 'vital' },
      { id: 'HeartRisk', label: 'Cardio Risk', group: 'risk' },
      { id: 'DiabetesRisk', label: 'Diabetes Risk', group: 'risk' }
    ],
    relationships: [
      { source: 'Rashmi', target: 'Sleep', type: 'HABIT_SLEEP', weight: 1.0 },
      { source: 'Rashmi', target: 'Weight', type: 'PHYSIO_MASS', weight: 1.0 },
      { source: 'Sleep', target: 'Stress', type: 'REGULATES_CORTISOL', weight: -0.65 },
      { source: 'Stress', target: 'BP', type: 'SYMPATHETIC_TENSION', weight: 0.55 },
      { source: 'Weight', target: 'BP', type: 'VASCULAR_COMPRESSION', weight: 0.45 },
      { source: 'BP', target: 'HeartRisk', type: 'MYOCARDIAL_LOAD', weight: 0.70 },
      { source: 'Glucose', target: 'DiabetesRisk', type: 'GLYCEMIC_BURDEN', weight: 0.85 }
    ]
  };
};

// Mock Redis Cache Manager
export interface RedisCacheEntry {
  key: string;
  value: string;
  ttl: number;
  hits: number;
}

export class RedisMockCache {
  private static cache: Map<string, RedisCacheEntry> = new Map([
    ['sess:patient:rashmi', { key: 'sess:patient:rashmi', value: '{"id":1,"status":"active"}', ttl: 86400, hits: 14 }],
    ['cache:shap:heart:rashmi', { key: 'cache:shap:heart:rashmi', value: '{"contributions":7,"base":15}', ttl: 3600, hits: 32 }]
  ]);
  
  public static logs: string[] = [];
  public static hitCount = 46;
  public static missCount = 3;
  
  public static get(key: string): string | null {
    const entry = this.cache.get(key);
    if (entry) {
      entry.hits++;
      this.hitCount++;
      this.logs.unshift(`[Redis] CACHE HIT - Key: "${key}" (TTL: ${entry.ttl}s)`);
      return entry.value;
    }
    this.missCount++;
    this.logs.unshift(`[Redis] CACHE MISS - Key: "${key}" (Generating dynamic values...)`);
    return null;
  }
  
  public static set(key: string, value: string, ttlSeconds = 3600) {
    this.cache.set(key, { key, value, ttl: ttlSeconds, hits: 0 });
    this.logs.unshift(`[Redis] CACHE SET - Key: "${key}" (Value cached with TTL: ${ttlSeconds}s)`);
  }
  
  public static clear() {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
    this.logs.unshift(`[Redis] CACHE FLUSHED - All keys evicted.`);
  }
  
  public static getEntries(): RedisCacheEntry[] {
    return Array.from(this.cache.values());
  }
}

// ==========================================
// 4. EVOLUTIONARY HEALTH PASSPORT
// ==========================================

export interface PassportBlock {
  version: number;
  timestamp: string;
  overallHealthScore: number;
  heartRiskPct: number;
  diabetesRiskPct: number;
  stateHash: string; // SHA-256 Mock hash
  parentHash: string;
  vitalsFingerprint: string;
}

// Simple deterministic hash function mimicking SHA-256
export const generateSHA256Hash = (input: string): string => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'f6a0d287' + Math.abs(hash).toString(16).padStart(8, '0') + 'c912e753b8fde09';
};

// Generates the AI Health Fingerprint string
export const generateAIHealthFingerprint = (data: HealthData, scores: HealthScores): { fingerprint: string; rawText: string } => {
  const rawText = `Patient:Rashmi|Age:${data.age}|Sex:${data.gender}|BP:${data.bpSystolic}/${data.bpDiastolic}|Glucose:${data.glucose}|Steps:${data.dailySteps}|Scores:H:${scores.overallHealth},C:${scores.heartRisk},D:${scores.diabetesRisk}`;
  const fingerprint = generateSHA256Hash(rawText);
  return { fingerprint, rawText };
};

// In-memory Ledger representing Version-controlled Health Evolution
export class HealthPassportLedger {
  private static blocks: PassportBlock[] = [
    {
      version: 1,
      timestamp: '2026-06-01 09:30',
      overallHealthScore: 84,
      heartRiskPct: 22,
      diabetesRiskPct: 15,
      stateHash: 'f6a0d2877a1e0b53c912e753b8fde09',
      parentHash: '0000000000000000000000000000000',
      vitalsFingerprint: 'Initial Ingestion - Baseline health profile verified.'
    },
    {
      version: 2,
      timestamp: '2026-06-18 14:15',
      overallHealthScore: 78,
      heartRiskPct: 34,
      diabetesRiskPct: 26,
      stateHash: 'f6a0d287c88b0d4ac912e753b8fde09',
      parentHash: 'f6a0d2877a1e0b53c912e753b8fde09',
      vitalsFingerprint: 'Sleep reduction anomaly detected. Stress-induced BP elevated.'
    },
    {
      version: 3,
      timestamp: '2026-07-01 11:22',
      overallHealthScore: 85,
      heartRiskPct: 20,
      diabetesRiskPct: 12,
      stateHash: 'f6a0d287ef93c9d1c912e753b8fde09',
      parentHash: 'f6a0d287c88b0d4ac912e753b8fde09',
      vitalsFingerprint: 'Aerobic step increase registered. Sleep-cycle restoration verified.'
    }
  ];
  
  public static getLedger(): PassportBlock[] {
    return this.blocks;
  }
  
  public static commitNewBlock(data: HealthData, scores: HealthScores) {
    const parentBlock = this.blocks[this.blocks.length - 1];
    const { fingerprint } = generateAIHealthFingerprint(data, scores);
    
    // Only commit if different from current top block
    if (parentBlock.overallHealthScore === scores.overallHealth && 
        parentBlock.heartRiskPct === scores.heartRisk &&
        parentBlock.diabetesRiskPct === scores.diabetesRisk) {
      return; // Deduplicate sequential commits
    }
    
    const newBlock: PassportBlock = {
      version: parentBlock.version + 1,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      overallHealthScore: scores.overallHealth,
      heartRiskPct: scores.heartRisk,
      diabetesRiskPct: scores.diabetesRisk,
      stateHash: fingerprint,
      parentHash: parentBlock.stateHash,
      vitalsFingerprint: `Update: Age=${data.age}, BP=${data.bpSystolic}/${data.bpDiastolic}, Glucose=${data.glucose}, Steps=${data.dailySteps}`
    };
    
    this.blocks.push(newBlock);
  }
}
