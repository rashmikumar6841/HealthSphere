import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  runDataPipeline,
  computeFeatureVector,
  calculateSHAPValues,
  calculateLIMEExplanations,
  traceRootCausePath,
  runPostgreSQLQuery,
  getNeo4jGraph,
  RedisMockCache,
  HealthPassportLedger,
  generateAIHealthFingerprint,
  RawDataSourceInput,
  SHAPContribution,
  CausalPathStep,
  PGQueryResult,
  PassportBlock
} from '../services/architectureService';
import {
  Database,
  Activity,
  FileText,
  BrainCircuit,
  Key,
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  Terminal,
  Network,
  History,
  QrCode,
  UserCheck,
  ArrowRight,
  ChevronRight,
  Info,
  Layers,
  Lock,
  Settings,
  Clock,
  Sparkles,
  Flame,
  Moon,
  Scale,
  Brain
} from 'lucide-react';

export const ArchitecturePipeline: React.FC = () => {
  const { healthData, currentScores } = useApp();
  const [activeTab, setActiveTab] = useState<'ingestion' | 'databases' | 'core' | 'passport' | 'portal'>('ingestion');
  
  // ==========================================
  // STAGE 1: INGESTION STATE
  // ==========================================
  const [sourceType, setSourceType] = useState<RawDataSourceInput['sourceType']>('wearable');
  const [rawDataStr, setRawDataStr] = useState<string>('');
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [pipelineErrors, setPipelineErrors] = useState<string[]>([]);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [engineeredFeatures, setEngineeredFeatures] = useState<any>(null);

  const rawDataTemplates: Record<RawDataSourceInput['sourceType'], string> = {
    wearable: JSON.stringify({
      dailySteps: 9400,
      heartRate: 68,
      sleepDuration: 7.2,
      stressLevel: 3
    }, null, 2),
    electronic_record: JSON.stringify({
      age: 48,
      gender: 'male',
      height: 176,
      weight: 81,
      smoking: 'non-smoker',
      alcohol: 'moderate',
      familyHistory: 'yes'
    }, null, 2),
    lab_report: JSON.stringify({
      bloodPressure: '130/84',
      glucose: 104
    }, null, 2),
    nutrition_log: JSON.stringify({
      alcoholConsumption: 'none',
      exerciseFrequency: 3.5
    }, null, 2)
  };

  useEffect(() => {
    setRawDataStr(rawDataTemplates[sourceType]);
  }, [sourceType]);

  const handleRunPipeline = () => {
    setIsPipelineRunning(true);
    setPipelineLogs(['[System] Initializing ingestion pipeline bootstrap...']);
    setPipelineErrors([]);
    
    setTimeout(() => {
      const res = runDataPipeline({
        sourceType,
        timestamp: new Date().toLocaleTimeString(),
        rawData: rawDataStr
      });
      
      setPipelineLogs(res.logs);
      setPipelineErrors(res.errors);
      setIsPipelineRunning(false);
      
      if (res.isValid) {
        // Compute features using mock values + current baseline elements
        const mergedData = { ...healthData, ...res.cleanedData };
        const features = computeFeatureVector(mergedData);
        setEngineeredFeatures(features);
      }
    }, 800);
  };

  // ==========================================
  // STAGE 2: DATABASES STATE
  // ==========================================
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM vitals_history LIMIT 5;');
  const [sqlResult, setSqlResult] = useState<PGQueryResult | null>(null);
  const [redisKeys, setRedisKeys] = useState<any[]>([]);
  const [redisLogs, setRedisLogs] = useState<string[]>([]);
  const [redisStats, setRedisStats] = useState({ hits: 0, misses: 0 });

  const loadDatabaseStates = () => {
    // Run initial default query
    const res = runPostgreSQLQuery(sqlQuery, healthData, currentScores);
    setSqlResult(res);
    
    // Fetch Redis Mock Cache keys and logs
    setRedisKeys(RedisMockCache.getEntries());
    setRedisLogs([...RedisMockCache.logs]);
    setRedisStats({ hits: RedisMockCache.hitCount, misses: RedisMockCache.missCount });
  };

  useEffect(() => {
    loadDatabaseStates();
  }, [sqlQuery, healthData, currentScores]);

  const handleRunSQL = () => {
    const res = runPostgreSQLQuery(sqlQuery, healthData, currentScores);
    setSqlResult(res);
  };

  const handleRedisGet = (key: string) => {
    RedisMockCache.get(key);
    loadDatabaseStates();
  };

  const handleRedisFlush = () => {
    RedisMockCache.clear();
    loadDatabaseStates();
  };

  // ==========================================
  // STAGE 3: CORE AI STATE
  // ==========================================
  const [activeModel, setActiveModel] = useState<'heart' | 'diabetes'>('heart');
  const [shapData, setShapData] = useState<SHAPContribution[]>([]);
  const [limeData, setLimeData] = useState<Record<string, number>>({});
  const [causalPath, setCausalPath] = useState<CausalPathStep[]>([]);

  useEffect(() => {
    const shap = calculateSHAPValues(healthData, activeModel);
    const lime = calculateLIMEExplanations(healthData, activeModel);
    const causal = traceRootCausePath(healthData);
    setShapData(shap);
    setLimeData(lime);
    setCausalPath(causal);
  }, [healthData, activeModel]);

  // ==========================================
  // STAGE 4: PASSPORT STATE
  // ==========================================
  const [ledgerBlocks, setLedgerBlocks] = useState<PassportBlock[]>([]);
  const [currentHashInfo, setCurrentHashInfo] = useState<any>({ fingerprint: '', rawText: '' });
  const [sharingExpiry, setSharingExpiry] = useState<number>(15); // minutes
  const [sharingAESKey, setSharingAESKey] = useState<string>('aes-gcm-256:7c9e01f2e519c288d40a');
  const [isCopied, setIsCopied] = useState(false);

  const loadLedger = () => {
    setLedgerBlocks([...HealthPassportLedger.getLedger()]);
    const info = generateAIHealthFingerprint(healthData, currentScores);
    setCurrentHashInfo(info);
  };

  useEffect(() => {
    loadLedger();
  }, [healthData, currentScores]);

  const handleCommitLedger = () => {
    HealthPassportLedger.commitNewBlock(healthData, currentScores);
    loadLedger();
  };

  const handleCopyLink = () => {
    const shareLink = `https://vitalpredict.health/share/passport?id=VP-2026-90412-R&sig=${currentHashInfo.fingerprint}&exp=${Date.now() + sharingExpiry * 60 * 1000}`;
    navigator.clipboard.writeText(shareLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Page Title Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tight">Core Architecture & Data Pipeline</h2>
        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
          Interactive pipeline console mapping raw data acquisition through the data processing layers, hybrid PostgreSQL/Neo4j/Redis data stores, Explainable ML core (SHAP/LIME), and Evolutionary Health Passport security.
        </p>
      </div>

      {/* ======================================================== */}
      {/* INTERACTIVE CORE ARCHITECTURE DIAGRAM MAP */}
      {/* ======================================================== */}
      <div className="bg-card/30 border border-border/50 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Interactive System Architecture Map</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center text-center relative z-10">
          
          {/* Node 1: Data Sources */}
          <div 
            onClick={() => setActiveTab('ingestion')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              activeTab === 'ingestion' 
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 scale-[1.03]' 
                : 'border-border/60 bg-card/45 hover:border-muted'
            }`}
          >
            <div className="flex justify-center mb-2 text-sky-400">
              <Layers size={22} />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider">1. Data Sources</h4>
            <p className="text-[10px] text-muted-foreground mt-1">EMR, Wearables, Labs</p>
          </div>

          {/* Connective arrow 1 */}
          <div className="hidden md:flex justify-center text-muted-foreground/30">
            <ArrowRight className="animate-pulse" />
          </div>

          {/* Node 2: Processing & Databases */}
          <div 
            onClick={() => setActiveTab('databases')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              activeTab === 'databases' 
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 scale-[1.03]' 
                : 'border-border/60 bg-card/45 hover:border-muted'
            }`}
          >
            <div className="flex justify-center mb-2 text-violet-400">
              <Database size={22} />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider">2. Data Layer</h4>
            <p className="text-[10px] text-muted-foreground mt-1">Postgres, Neo4j, Redis</p>
          </div>

          {/* Connective arrow 2 */}
          <div className="hidden md:flex justify-center text-muted-foreground/30">
            <ArrowRight className="animate-pulse" />
          </div>

          {/* Node 3: Health Intelligence Core */}
          <div 
            onClick={() => setActiveTab('core')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              activeTab === 'core' 
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 scale-[1.03]' 
                : 'border-border/60 bg-card/45 hover:border-muted'
            }`}
          >
            <div className="flex justify-center mb-2 text-pink-400">
              <BrainCircuit size={22} />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider">3. AI Core</h4>
            <p className="text-[10px] text-muted-foreground mt-1">Models, SHAP, LIME</p>
          </div>

          {/* Connective arrow 3 */}
          <div className="hidden md:flex justify-center text-muted-foreground/30 text-center">
            <ArrowRight className="animate-pulse" />
          </div>

          {/* Node 4: Health Passport */}
          <div 
            onClick={() => setActiveTab('passport')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              activeTab === 'passport' 
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 scale-[1.03]' 
                : 'border-border/60 bg-card/45 hover:border-muted'
            }`}
          >
            <div className="flex justify-center mb-2 text-amber-500">
              <QrCode size={22} />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider">4. Passport Ledger</h4>
            <p className="text-[10px] text-muted-foreground mt-1">AI Hash, versioning</p>
          </div>

          {/* Connective arrow 4 */}
          <div className="hidden md:flex justify-center text-muted-foreground/30">
            <ArrowRight className="animate-pulse" />
          </div>

          {/* Node 5: Clinical Portals */}
          <div 
            onClick={() => setActiveTab('portal')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              activeTab === 'portal' 
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 scale-[1.03]' 
                : 'border-border/60 bg-card/45 hover:border-muted'
            }`}
          >
            <div className="flex justify-center mb-2 text-emerald-400">
              <UserCheck size={22} />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider">5. Doctor Portal</h4>
            <p className="text-[10px] text-muted-foreground mt-1">Clinician Summary, Brief</p>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* TABBED INTERFACES */}
      {/* ======================================================== */}
      <div className="bg-card/45 backdrop-blur-md border border-border/60 rounded-3xl p-6 shadow-2xl">
        
        {/* Navigation Tabs Header */}
        <div className="flex border-b border-border/40 pb-3 mb-6 overflow-x-auto space-x-2">
          {[
            { id: 'ingestion', label: '1. Ingestion & Preprocessing', icon: Layers },
            { id: 'databases', label: '2. Hybrid Databases (PG/Redis)', icon: Database },
            { id: 'core', label: '3. Explainable AI & SHAP', icon: BrainCircuit },
            { id: 'passport', label: '4. Health Passport Ledger', icon: QrCode },
            { id: 'portal', label: '5. Doctor Portal Simulator', icon: UserCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/15'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* TAB 1: DATA SOURCES & INGESTION PIPELINE */}
        {/* ======================================================== */}
        {activeTab === 'ingestion' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Input Configuration */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-foreground">Select Active Data Source</h4>
                <p className="text-xs text-muted-foreground">Choose a raw stream to parse and validate.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'wearable', label: 'Smartwatch (Wearable)', desc: 'Steps, Sleep, HR' },
                  { id: 'electronic_record', label: 'Hospital EMR record', desc: 'Age, Sex, Weight' },
                  { id: 'lab_report', label: 'Lab Blood Report PDF', desc: 'Glucose, BP Split' },
                  { id: 'nutrition_log', label: 'Nutrition & Lifestyle Log', desc: 'Alcohol, Exercise' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSourceType(s.id as any)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      sourceType === s.id
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border/60 hover:border-muted text-muted-foreground'
                    }`}
                  >
                    <p className="font-bold">{s.label}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Raw Ingestion Payload (JSON)</label>
                <textarea
                  value={rawDataStr}
                  onChange={(e) => setRawDataStr(e.target.value)}
                  rows={6}
                  className="w-full bg-secondary/35 border border-border/80 rounded-2xl p-4 font-mono text-xs focus:outline-none focus:border-primary text-foreground leading-normal"
                />
              </div>

              <button
                onClick={handleRunPipeline}
                disabled={isPipelineRunning}
                className="w-full bg-primary text-primary-foreground font-semibold px-4 py-3 rounded-xl text-xs hover:bg-primary/95 transition-all flex items-center justify-center space-x-2 active:scale-[0.99] disabled:opacity-50"
              >
                <Play size={14} className={isPipelineRunning ? 'animate-spin' : ''} />
                <span>{isPipelineRunning ? 'Processing Ingestion...' : 'Execute Data Acquisition Pipeline'}</span>
              </button>
            </div>

            {/* Terminal logs & Engineered Features */}
            <div className="space-y-4 flex flex-col h-full">
              
              {/* Ingestion Console Logs */}
              <div className="flex-1 flex flex-col min-h-[180px] bg-black/60 rounded-2xl border border-white/5 p-4 font-mono text-[11px] text-emerald-400 overflow-hidden shadow-inner">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                  <span className="text-white flex items-center gap-1.5"><Terminal size={12} /> System Pipeline Terminal</span>
                  <span className="text-[9px] text-slate-500 font-bold">VP-Ingestion-v1.2</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-44">
                  {pipelineLogs.map((log, idx) => (
                    <div key={idx} className={log.includes('[Error]') ? 'text-red-400' : log.includes('[Validation]') ? 'text-violet-400' : 'text-emerald-400'}>
                      {log}
                    </div>
                  ))}
                  {pipelineLogs.length === 0 && (
                    <div className="text-slate-600 italic">Console idle. Awaiting pipeline execution...</div>
                  )}
                </div>
              </div>

              {/* Ingestion Errors */}
              {pipelineErrors.length > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start space-x-2">
                  <XCircle size={14} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Pipeline Validation Errors:</p>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      {pipelineErrors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                </div>
              )}

              {/* Engineered Feature Vector */}
              {engineeredFeatures && (
                <div className="p-4 bg-secondary/35 border border-border/40 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold flex items-center gap-1.5"><Sparkles size={13} className="text-primary" /> Engineered Feature Vector</h5>
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">NORM_SUCCESS</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-2 bg-secondary/20 border rounded-xl">
                      <p className="text-[9px] text-muted-foreground font-semibold">Pulse Pressure</p>
                      <p className="font-bold text-foreground mt-0.5">{engineeredFeatures.pulsePressure} mmHg</p>
                    </div>
                    <div className="p-2 bg-secondary/20 border rounded-xl">
                      <p className="text-[9px] text-muted-foreground font-semibold">Mean Arterial Pressure</p>
                      <p className="font-bold text-foreground mt-0.5">{engineeredFeatures.meanArterialPressure.toFixed(1)} mmHg</p>
                    </div>
                    <div className="p-2 bg-secondary/20 border rounded-xl">
                      <p className="text-[9px] text-muted-foreground font-semibold">Sleep/Stress ratio</p>
                      <p className="font-bold text-foreground mt-0.5">{engineeredFeatures.sleepToStressRatio.toFixed(2)}</p>
                    </div>
                    <div className="p-2 bg-secondary/20 border rounded-xl">
                      <p className="text-[9px] text-muted-foreground font-semibold">Cardiometabolic Index</p>
                      <p className="font-bold text-foreground mt-0.5">{engineeredFeatures.cardioMetabolicIndex.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: HYBRID DATABASES (POSTGRESQL & REDIS CACHE) */}
        {/* ======================================================== */}
        {activeTab === 'databases' && (
          <div className="space-y-6">
            
            {/* Database Intro Summary */}
            <div className="p-4 bg-secondary/35 border border-border/40 rounded-2xl flex flex-wrap justify-between items-center gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground">Platform Hybrid Storage Layer</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  PostgreSQL holds structured vital logs. Neo4j maps physiological connections. Redis caches prediction state hashes.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-sky-400/10 text-sky-400 border border-sky-400/20 font-mono">Postgres (Active)</span>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-400/10 text-violet-400 border border-violet-400/20 font-mono">Neo4j (Active)</span>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-400/10 text-red-400 border border-red-400/20 font-mono">Redis (Active)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* PostgreSQL Query Panel */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5"><Database size={14} className="text-sky-400" /> PostgreSQL Query Console</h4>
                  <span className="text-[9px] font-bold text-muted-foreground font-mono">Port: 5432</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Suggested Queries</label>
                  <select
                    onChange={(e) => setSqlQuery(e.target.value)}
                    value={sqlQuery}
                    className="w-full bg-secondary/35 border border-border/60 rounded-xl p-2 text-xs focus:outline-none text-foreground font-mono"
                  >
                    <option value="SELECT * FROM patients;">SELECT * FROM patients;</option>
                    <option value="SELECT * FROM vitals_history LIMIT 5;">SELECT * FROM vitals_history LIMIT 5;</option>
                    <option value="SELECT * FROM risk_scores;">SELECT * FROM risk_scores;</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    rows={3}
                    className="w-full bg-secondary/35 border border-border/80 rounded-2xl p-4 font-mono text-xs focus:outline-none focus:border-primary text-foreground"
                  />
                </div>

                <button
                  onClick={handleRunSQL}
                  className="bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-xl text-xs hover:bg-primary/95 transition-all flex items-center space-x-1.5 active:scale-95 shadow-md shadow-primary/20"
                >
                  <Play size={13} />
                  <span>Execute SQL Query</span>
                </button>

                {/* SQL Result Table */}
                {sqlResult && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span>Query executed in {sqlResult.executionTimeMs}ms</span>
                      <span>{sqlResult.rows.length} rows returned</span>
                    </div>
                    
                    <div className="overflow-x-auto border border-border/60 rounded-xl bg-secondary/20 max-h-48 overflow-y-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-secondary/45 text-muted-foreground border-b border-border/50">
                          <tr>
                            {sqlResult.columns.map((col) => (
                              <th key={col} className="px-3 py-2 text-[10px] uppercase font-bold">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 text-foreground">
                          {sqlResult.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-secondary/30">
                              {row.map((val, cIdx) => (
                                <td key={cIdx} className="px-3 py-1.5">{typeof val === 'string' ? val : JSON.stringify(val)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Redis Key-Value Cache Panel */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5"><Database size={14} className="text-red-400" /> Redis Cache Manager</h4>
                  <span className="text-[9px] font-bold text-muted-foreground font-mono">Port: 6379</span>
                </div>

                {/* Cache Stats */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                    <p className="text-[9px] text-muted-foreground font-bold uppercase">CACHE HITS</p>
                    <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">{redisStats.hits}</p>
                  </div>
                  <div className="p-2.5 bg-red-500/5 border border-red-500/10 rounded-xl">
                    <p className="text-[9px] text-muted-foreground font-bold uppercase">CACHE MISSES</p>
                    <p className="text-lg font-black text-red-400 font-mono mt-0.5">{redisStats.misses}</p>
                  </div>
                  <div className="p-2.5 bg-secondary/35 border border-border/40 rounded-xl flex items-center justify-center">
                    <button
                      onClick={handleRedisFlush}
                      className="text-[10px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1.5 hover:underline"
                    >
                      <RefreshCw size={11} /> Flush Cache
                    </button>
                  </div>
                </div>

                {/* Cache Keys Table */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Memory Keys</p>
                  <div className="border border-border/50 rounded-2xl bg-secondary/15 max-h-40 overflow-y-auto pr-1">
                    {redisKeys.map((k) => (
                      <div key={k.key} className="p-2.5 border-b border-border/30 last:border-none flex items-center justify-between text-xs font-mono">
                        <div>
                          <span className="text-red-400 font-semibold">{k.key}</span>
                          <span className="text-[9px] text-slate-500 ml-2">TTL: {k.ttl}s</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-slate-500">Hits: {k.hits}</span>
                          <button
                            onClick={() => handleRedisGet(k.key)}
                            className="bg-secondary px-2 py-0.5 rounded border border-border/80 hover:bg-secondary/85 text-[10px] font-bold"
                          >
                            GET
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cache Access logs */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cache Transaction Logs</p>
                  <div className="bg-black/60 border border-white/5 p-3 rounded-2xl font-mono text-[10px] text-red-400 h-28 overflow-y-auto">
                    {redisLogs.map((log, idx) => (
                      <div key={idx} className="py-0.5 border-b border-white/5 last:border-none">
                        {log}
                      </div>
                    ))}
                    {redisLogs.length === 0 && (
                      <span className="text-slate-600 italic">No transactions registered yet...</span>
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: HEALTH INTELLIGENCE CORE (XAI & SHAP BAR CHART) */}
        {/* ======================================================== */}
        {activeTab === 'core' && (
          <div className="space-y-6 animate-fade-in">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border/40 pb-4 gap-4">
              <div>
                <h4 className="text-sm font-bold text-foreground">Explainable AI Core Calibration</h4>
                <p className="text-xs text-muted-foreground">Select a prediction model to inspect SHAP feature weight contribution attributions.</p>
              </div>

              {/* Toggle Heart / Diabetes */}
              <div className="flex bg-secondary/45 border border-border/60 rounded-xl p-1 shrink-0">
                <button
                  onClick={() => setActiveModel('heart')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeModel === 'heart'
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Cardio XGBoost Model
                </button>
                <button
                  onClick={() => setActiveModel('diabetes')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeModel === 'diabetes'
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Metabolic Random Forest
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              
              {/* SHAP Bar Chart representation */}
              <div className="p-5 bg-secondary/35 border border-border/40 rounded-3xl space-y-4 flex flex-col justify-between">
                <div>
                  <h5 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <BrainCircuit size={14} className="text-pink-400" /> Game-Theoretic SHAP Attributions
                  </h5>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                    Red bars represent risk-amplifying indicators. Green bars represent protective indicators. Weights sum up relative to the baseline score.
                  </p>
                </div>

                <div className="space-y-3.5 my-4 flex-1">
                  {shapData.map((item) => {
                    const isPositive = item.shapValue > 0;
                    const maxWeight = 25; // scaling maximum
                    const absVal = Math.min(maxWeight, Math.abs(item.shapValue));
                    const widthPct = (absVal / maxWeight) * 50; // max 50% width on either side
                    
                    return (
                      <div key={item.feature} className="text-xs space-y-1">
                        <div className="flex justify-between items-center font-medium">
                          <span>{item.displayName} <span className="text-[10px] text-muted-foreground font-mono">({item.originalValue})</span></span>
                          <span className={`font-mono font-bold ${isPositive ? 'text-red-400' : 'text-emerald-400'}`}>
                            {isPositive ? `+${item.shapValue}%` : `${item.shapValue}%`}
                          </span>
                        </div>
                        
                        {/* Bi-directional horizontal bar wrapper */}
                        <div className="relative w-full h-3 bg-muted/20 rounded-full flex items-center overflow-hidden">
                          {/* Midline separator */}
                          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-border z-10"></div>
                          
                          {isPositive ? (
                            // Draw Right for Positive Risk
                            <div 
                              className="absolute left-1/2 bg-gradient-to-r from-red-500/80 to-pink-500 h-full rounded-r-full transition-all duration-500"
                              style={{ width: `${widthPct}%` }}
                            ></div>
                          ) : (
                            // Draw Left for Negative Risk (Protective)
                            <div 
                              className="absolute right-1/2 bg-gradient-to-l from-emerald-500/80 to-teal-400 h-full rounded-l-full transition-all duration-500"
                              style={{ width: `${widthPct}%` }}
                            ></div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-border/40 pt-3 text-[10px] text-muted-foreground flex justify-between">
                  <span>Model Base Expected Value: {activeModel === 'heart' ? '15.0%' : '12.0%'}</span>
                  <span className="font-bold text-foreground">Attributed Risk Sum: {activeModel === 'heart' ? `${currentScores.heartRisk}%` : `${currentScores.diabetesRisk}%`}</span>
                </div>
              </div>

              {/* LIME Parameters & Root Cause tracer */}
              <div className="space-y-6">
                
                {/* LIME Approximations */}
                <div className="p-4 bg-secondary/35 border border-border/40 rounded-3xl space-y-3">
                  <h5 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <Info size={14} className="text-violet-400" /> LIME Local Attribution Models
                  </h5>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Perturbed values approximations fitted locally around current patient profile coordinate.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {Object.entries(limeData).slice(0, 4).map(([name, weight]) => (
                      <div key={name} className="p-2.5 bg-secondary/20 border border-border/40 rounded-xl flex justify-between">
                        <span className="text-muted-foreground truncate max-w-[120px]">{name}</span>
                        <span className={weight > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                          {weight > 0 ? `+${weight}` : weight}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Root Cause Traced Path */}
                <div className="p-4 bg-secondary/35 border border-border/40 rounded-3xl space-y-3">
                  <h5 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <Network size={14} className="text-indigo-400" /> Causal Root Cause Path Tracer
                  </h5>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Traces high weight paths in Neo4j relational logic that trigger final output risk factors.
                  </p>
                  
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {causalPath.map((step, idx) => (
                      <div key={idx} className="flex space-x-3 text-xs leading-normal">
                        <div className="relative flex flex-col items-center">
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-[9px]">
                            {idx + 1}
                          </span>
                          {idx < causalPath.length - 1 && <div className="w-[1px] h-full bg-border/80 mt-1"></div>}
                        </div>
                        <div className="flex-1 pb-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-foreground">{step.sourceNode}</span>
                            <ArrowRight size={10} className="text-muted-foreground" />
                            <span className="font-bold text-primary">{step.targetNode}</span>
                          </div>
                          <span className="text-[9px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">
                            {step.relationship} (w: {step.weight})
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                    {causalPath.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">No elevated risk paths triggered. Physiology is stable.</p>
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: EVOLUTIONARY HEALTH PASSPORT LEDGER */}
        {/* ======================================================== */}
        {activeTab === 'passport' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch animate-fade-in">
            
            {/* Version control Timeline ledger */}
            <div className="lg:col-span-2 p-5 bg-secondary/35 border border-border/40 rounded-3xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <History size={14} className="text-amber-500" /> Immutable Version-Controlled Ledger
                  </h5>
                  <button
                    onClick={handleCommitLedger}
                    className="text-[10px] font-bold bg-primary text-primary-foreground border border-primary/25 px-2.5 py-1 rounded-lg hover:bg-primary/95 transition-all shadow"
                  >
                    Commit Current State to Ledger
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                  Immutable chain log tracking key health transitions. Every modification generates a new parent-linked cryptographic block.
                </p>
              </div>

              {/* Timeline blocks */}
              <div className="space-y-4 my-4 flex-1 max-h-[380px] overflow-y-auto pr-1">
                {ledgerBlocks.map((block) => (
                  <div key={block.version} className="relative pl-6 border-l-2 border-border/60 ml-2 space-y-1.5">
                    {/* Node Dot */}
                    <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-amber-500 border border-card shadow"></span>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                        Block Version v{block.version}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-mono flex items-center gap-1">
                        <Clock size={9} /> {block.timestamp}
                      </span>
                    </div>

                    <div className="p-3 bg-secondary/20 border border-border/30 rounded-xl space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono font-bold">
                        <div className="p-1 bg-secondary/35 border rounded">
                          <p className="text-muted-foreground text-[8px]">OVERALL HEALTH</p>
                          <p className="text-foreground mt-0.5">{block.overallHealthScore}/100</p>
                        </div>
                        <div className="p-1 bg-secondary/35 border rounded">
                          <p className="text-muted-foreground text-[8px]">CARDIO RISK</p>
                          <p className="text-foreground mt-0.5">{block.heartRiskPct}%</p>
                        </div>
                        <div className="p-1 bg-secondary/35 border rounded">
                          <p className="text-muted-foreground text-[8px]">DIABETES RISK</p>
                          <p className="text-foreground mt-0.5">{block.diabetesRiskPct}%</p>
                        </div>
                      </div>

                      <p className="text-[10px] text-muted-foreground italic truncate">
                        {block.vitalsFingerprint}
                      </p>

                      <div className="pt-1.5 border-t border-border/20 flex flex-col gap-0.5 text-[8px] font-mono text-slate-500">
                        <span className="truncate">Hash: {block.stateHash}</span>
                        <span className="truncate">Parent: {block.parentHash}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cryptographic Signature & QR Sharing */}
            <div className="lg:col-span-1 p-5 bg-card/45 backdrop-blur-md border border-border/60 rounded-3xl flex flex-col justify-between space-y-6">
              
              {/* Hashing Signature */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Key size={14} className="text-amber-500" /> AI Health Fingerprint
                </h5>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Deteministic SHA-256 signature calculated from the current patient profile metrics vector.
                </p>
                <div className="p-3 bg-secondary/35 border border-border/40 rounded-xl space-y-2 text-[10px] font-mono">
                  <div>
                    <span className="text-muted-foreground">Generated Hash:</span>
                    <p className="text-amber-400 font-bold break-all mt-0.5">{currentHashInfo.fingerprint}</p>
                  </div>
                  <div className="border-t border-border/20 pt-2 max-h-24 overflow-y-auto">
                    <span className="text-muted-foreground">Original Hash String:</span>
                    <p className="text-slate-500 leading-normal break-all mt-0.5">{currentHashInfo.rawText}</p>
                  </div>
                </div>
              </div>

              {/* QR Code Scan sharing */}
              <div className="space-y-4">
                <h5 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <QrCode size={14} className="text-amber-500" /> Secure Doctor Sharing
                </h5>
                
                {/* Styled Mock QR Code */}
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 w-36 h-36 mx-auto relative group">
                  <div className="w-28 h-28 bg-gradient-to-tr from-slate-900 to-indigo-900 flex items-center justify-center rounded p-1">
                    {/* SVG mockup of a complex QR matrix */}
                    <svg className="w-full h-full text-white" viewBox="0 0 100 100" fill="currentColor">
                      <rect x="0" y="0" width="20" height="20" />
                      <rect x="5" y="5" width="10" height="10" fill="white" />
                      <rect x="80" y="0" width="20" height="20" />
                      <rect x="85" y="5" width="10" height="10" fill="white" />
                      <rect x="0" y="80" width="20" height="20" />
                      <rect x="5" y="85" width="10" height="10" fill="white" />
                      {/* Dots */}
                      <circle cx="40" cy="15" r="4" />
                      <circle cx="55" cy="20" r="5" />
                      <circle cx="65" cy="10" r="4" />
                      <circle cx="45" cy="45" r="6" />
                      <circle cx="30" cy="65" r="5" />
                      <circle cx="65" cy="55" r="4" />
                      <circle cx="80" cy="75" r="5" />
                      <circle cx="15" cy="45" r="4" />
                      <circle cx="50" cy="80" r="4" />
                      {/* Inner Target */}
                      <rect x="42" y="42" width="16" height="16" fill="rgb(168, 85, 247)" />
                      <rect x="46" y="46" width="8" height="8" fill="white" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 bg-black/80 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-white font-bold text-center px-2">AES-256 Key Included</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                    <span>Sharing Expiration Link:</span>
                    <span>{sharingExpiry} mins</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={120}
                    step={5}
                    value={sharingExpiry}
                    onChange={(e) => setSharingExpiry(Number(e.target.value))}
                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Temporal Handshake Key</span>
                  <div className="p-2 bg-secondary/35 border border-border/60 rounded-xl text-[10px] font-mono text-slate-500 break-all select-all flex justify-between items-center">
                    <span className="truncate max-w-[170px]">{sharingAESKey}</span>
                    <span className="text-[9px] text-primary font-bold uppercase shrink-0">GCM</span>
                  </div>
                </div>

                <button
                  onClick={handleCopyLink}
                  className="w-full border border-border hover:bg-secondary text-xs font-semibold px-3 py-2 rounded-xl transition-all active:scale-95 text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5"
                >
                  <Lock size={12} />
                  <span>{isCopied ? 'Secure Link Copied!' : 'Copy Encryption Share Link'}</span>
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: DOCTOR PORTAL SIMULATOR */}
        {/* ======================================================== */}
        {activeTab === 'portal' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Clinician Header */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Doctor Portal Console Active</h4>
                  <p className="text-[11px] text-muted-foreground">Displaying HIPAA-protected patient record digest and explainable clinical decisions.</p>
                </div>
              </div>
              <span className="text-[9px] font-bold font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded">VP-DoctorPortal-v1.2</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              
              {/* Section 1: Patient Clinical Vitals brief */}
              <div className="lg:col-span-1 p-5 bg-secondary/35 border border-border/40 rounded-3xl space-y-5">
                <div className="border-b border-border/40 pb-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider">Patient Records Overview</h5>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Patient UUID: VP-2026-90412-R</p>
                </div>

                <div className="space-y-3.5 text-xs font-semibold">
                  <div className="flex justify-between py-1 border-b border-border/20">
                    <span className="text-muted-foreground">Patient Name</span>
                    <span className="text-foreground">Rashmi</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/20">
                    <span className="text-muted-foreground">Age / Biological Sex</span>
                    <span className="text-foreground">{healthData.age} Yrs / {healthData.gender === 'male' ? 'Male' : 'Female'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/20">
                    <span className="text-muted-foreground">Active Blood Pressure</span>
                    <span className="text-foreground font-mono">{healthData.bpSystolic}/{healthData.bpDiastolic} mmHg</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/20">
                    <span className="text-muted-foreground">Fasting Serum Sugar</span>
                    <span className="text-foreground font-mono">{healthData.glucose} mg/dL</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/20">
                    <span className="text-muted-foreground">Resting Pulse rate</span>
                    <span className="text-foreground font-mono">{healthData.heartRate} bpm</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/20">
                    <span className="text-muted-foreground">Body Mass Index (BMI)</span>
                    <span className="text-foreground font-mono">{(healthData.weight / Math.pow(healthData.height / 100, 2)).toFixed(1)} kg/m²</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="p-3 bg-secondary/20 border border-border/40 rounded-xl space-y-1">
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">AI Health Signature Verified</p>
                    <p className="text-[10px] font-mono text-emerald-400 break-all">{currentHashInfo.fingerprint.substring(0, 24)}...</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Clinical Summary & Questions generator */}
              <div className="lg:col-span-2 p-5 bg-secondary/35 border border-border/40 rounded-3xl space-y-5">
                <div className="border-b border-border/40 pb-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider">Clinical Consultation Brief</h5>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Synthesized by game-theoretic explainable models to support physician evaluation.</p>
                </div>

                {/* Anomalies alert */}
                <div className="p-3.5 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl space-y-2">
                  <p className="text-xs font-bold text-yellow-500 flex items-center gap-1.5"><Info size={13} /> Active Clinical Observations</p>
                  <ul className="list-disc pl-4 text-[11px] text-muted-foreground space-y-1 leading-relaxed">
                    <li>BP is systolic-elevated (Stage 1 Hypertension indicators). SHAP attributes this to stress & weight levels.</li>
                    <li>Fasting glucose is in the pre-diabetic window (100-125 mg/dL). Dynamic path trace suggests metabolic receptor downregulation.</li>
                    <li>Sustained active smoking multiplies relative cardiac risk indicators by 1.45x.</li>
                  </ul>
                </div>

                {/* Clinician Questions */}
                <div className="space-y-2.5">
                  <h5 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5"><Brain size={13} className="text-primary" /> Auto-Generated Consult Inquiries</h5>
                  <div className="space-y-2 pl-2 text-xs text-muted-foreground">
                    <div className="flex gap-2 items-start py-0.5 border-b border-border/10 last:border-none pb-1.5">
                      <span className="font-bold text-emerald-500">Q1.</span>
                      <p className="leading-relaxed">Is the patient's blood pressure baseline elevated enough to warrant ACE-inhibitor initiation, or should we track lifestyle deflection for 90 days?</p>
                    </div>
                    <div className="flex gap-2 items-start py-0.5 border-b border-border/10 last:border-none pb-1.5">
                      <span className="font-bold text-emerald-500">Q2.</span>
                      <p className="leading-relaxed">Given fasting glucose values and family history, should we run a diagnostic HbA1c panel to confirm diabetic pre-thresholds?</p>
                    </div>
                    <div className="flex gap-2 items-start py-0.5 border-b border-border/10 last:border-none pb-1.5">
                      <span className="font-bold text-emerald-500">Q3.</span>
                      <p className="leading-relaxed">What pharmacological or behavioral support mechanisms would be most suitable to mitigate smoking-induced vascular stiffness markers?</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};
