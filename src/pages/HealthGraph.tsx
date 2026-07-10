import React, { useState, useMemo, useCallback } from 'react';
import { ReactFlow, MiniMap, Controls, Background, Node, Edge, useNodesState, useEdgesState, ConnectionLineType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useApp } from '../context/AppContext';
import {
  Moon,
  Activity,
  Heart,
  Brain,
  Scale,
  Flame,
  Zap,
  TrendingUp,
  Fingerprint,
  Info,
  ExternalLink
} from 'lucide-react';

// Custom Node structure interface
interface NodeDetails {
  id: string;
  name: string;
  description: string;
  currentValue: string;
  influenceWeight: string;
  riskContribution: string;
  connections: { node: string; weight: number; effect: string }[];
  icon: React.ElementType;
}

export const HealthGraph: React.FC = () => {
  const { healthData, currentScores } = useApp();
  const [selectedNodeId, setSelectedNodeId] = useState<string>('heartRisk');

  const bmi = healthData.weight / Math.pow(healthData.height / 100, 2);

  // Clinical node details dictionary
  const nodeRegistry = useMemo<Record<string, NodeDetails>>(() => ({
    sleep: {
      id: 'sleep',
      name: 'Sleep Quality',
      description: 'Sleep duration and restorative cycles regulate the autonomic nervous system, cortisol production, and cardiovascular recovery.',
      currentValue: `${healthData.sleepDuration} hrs/night (Score: ${currentScores.sleepScore}/100)`,
      influenceWeight: 'High (0.75)',
      riskContribution: 'Improves sleep-dependent neural recovery, lowers resting heart rate, and decreases arterial strain.',
      connections: [
        { node: 'stress', weight: -0.65, effect: 'Reduces cortisol production' },
        { node: 'bp', weight: -0.40, effect: 'Decreases nocturnal BP baseline' },
        { node: 'heartRisk', weight: -0.25, effect: 'Direct cardioregenerative protectant' }
      ],
      icon: Moon
    },
    stress: {
      id: 'stress',
      name: 'Stress Level Index',
      description: 'Systemic psychological stress induces sympathoadrenal activation, prompting sustained cortisol and catecholamine release.',
      currentValue: `${healthData.stressLevel}/10 (Score: ${currentScores.stressScore}/100)`,
      influenceWeight: 'Critical (0.80)',
      riskContribution: 'Elevates resting heart rate, triggers vasoconstriction, and induces cellular insulin resistance.',
      connections: [
        { node: 'bp', weight: 0.55, effect: 'Sustained sympathetic vasoconstriction' },
        { node: 'glucose', weight: 0.35, effect: 'Cortisol-induced glucose release' },
        { node: 'sleep', weight: -0.70, effect: 'Disrupts delta-wave sleep cycles' }
      ],
      icon: Brain
    },
    weight: {
      id: 'weight',
      name: 'Body Weight',
      description: 'Excess body mass increases myocardial workload, mechanical pressure inside vascular paths, and releases inflammatory cytokines.',
      currentValue: `${healthData.weight} kg (Height: ${healthData.height} cm)`,
      influenceWeight: 'High (0.70)',
      riskContribution: 'Acts as a secondary metabolic multiplier, amplifying hypertension and insulin tolerance thresholds.',
      connections: [
        { node: 'bmi', weight: 0.95, effect: 'Direct numerator calculation' },
        { node: 'bp', weight: 0.45, effect: 'Increases vascular compression resistance' }
      ],
      icon: Scale
    },
    nutrition: {
      id: 'nutrition',
      name: 'Nutrition Profile',
      description: 'Dietary intake of sodium, refined carbohydrates, and saturated fats dictates glucose absorption rates and arterial stiffness.',
      currentValue: healthData.alcohol === 'high' ? 'High Glycemic Load / High Alcohol' : 'Standard Glycemic Load',
      influenceWeight: 'Moderate (0.60)',
      riskContribution: 'Direct contributor to hepatic fat deposits, blood glucose spiking, and intravascular volume load.',
      connections: [
        { node: 'glucose', weight: 0.75, effect: 'Carbohydrate conversion to blood sugar' },
        { node: 'weight', weight: 0.60, effect: 'Excess caloric storage as adipose tissue' }
      ],
      icon: Flame
    },
    activity: {
      id: 'activity',
      name: 'Physical Activity',
      description: 'Cardiorespiratory fitness enhances nitric oxide synthesis, promotes peripheral glucose uptake, and increases HRV.',
      currentValue: `${healthData.exerciseFrequency} days/week (${healthData.dailySteps} steps)`,
      influenceWeight: 'High (0.85)',
      riskContribution: 'Direct protective factor that actively clears vascular plaque and lowers metabolic resistance.',
      connections: [
        { node: 'heartRisk', weight: -0.50, effect: 'Promotes arterial elasticity and lower HR' },
        { node: 'diabetesRisk', weight: -0.45, effect: 'Improves non-insulin glucose uptake' },
        { node: 'stress', weight: -0.40, effect: 'Clears circulating catecholamines' }
      ],
      icon: Zap
    },
    bmi: {
      id: 'bmi',
      name: 'Body Mass Index (BMI)',
      description: 'A mathematical ratio indicating volumetric tissue distribution, which acts as a biomarker for visceral adipose tissue.',
      currentValue: `${bmi.toFixed(1)} kg/m²`,
      influenceWeight: 'Moderate (0.55)',
      riskContribution: 'Visceral fat acts as an endocrine organ, secreting inflammatory cytokines that worsen vascular and insulin resistance.',
      connections: [
        { node: 'diabetesRisk', weight: 0.50, effect: 'Amplifies cellular resistance' },
        { node: 'heartRisk', weight: 0.35, effect: 'Increases systemic vessel resistance' }
      ],
      icon: Scale
    },
    glucose: {
      id: 'glucose',
      name: 'Blood Glucose',
      description: 'Fasting serum glucose concentrations indicate the operational performance of islet beta-cells and liver storage patterns.',
      currentValue: `${healthData.glucose} mg/dL`,
      influenceWeight: 'Critical (0.90)',
      riskContribution: 'Elevated glucose molecules cause vascular glycated damage, damaging microvessels and kidneys.',
      connections: [
        { node: 'diabetesRisk', weight: 0.85, effect: 'Primary trigger for clinical type-2 threshold' }
      ],
      icon: Activity
    },
    bp: {
      id: 'bp',
      name: 'Blood Pressure',
      description: 'The physical force exerted by blood on arterial walls, reflecting systemic vascular resistance and cardiac pump pressure.',
      currentValue: `${healthData.bpSystolic}/${healthData.bpDiastolic} mmHg`,
      influenceWeight: 'Critical (0.95)',
      riskContribution: 'High pressure causes micro-tears in vessels, initiating atheroma formation and increasing risk of vessel blockages.',
      connections: [
        { node: 'heartRisk', weight: 0.70, effect: 'Direct mechanical vessel wall stressor' }
      ],
      icon: Activity
    },
    heartRisk: {
      id: 'heartRisk',
      name: 'Heart Disease Risk',
      description: 'Calculated mathematical risk of major cardiovascular events, combining physical vitals, lifestyle habits, and genetics.',
      currentValue: `${currentScores.heartRisk}% Probability`,
      influenceWeight: 'Primary Output',
      riskContribution: 'Represents the combined explainable probability of congestive failure or ischemic blockage.',
      connections: [],
      icon: Heart
    },
    diabetesRisk: {
      id: 'diabetesRisk',
      name: 'Diabetes Risk',
      description: 'Calculated probability of developing metabolic diabetes due to cellular insulin resistance and hepatic load.',
      currentValue: `${currentScores.diabetesRisk}% Probability`,
      influenceWeight: 'Primary Output',
      riskContribution: 'Represents the combined probability of clinical insulin dependency.',
      connections: [],
      icon: TrendingUp
    }
  }), [healthData, currentScores, bmi]);

  // Map nodes to React Flow layout coordinates
  const initialNodes: Node[] = useMemo(() => [
    {
      id: 'nutrition',
      position: { x: 50, y: 50 },
      data: { label: 'Nutrition Profile', type: 'lifestyle' },
      style: { width: 140 }
    },
    {
      id: 'sleep',
      position: { x: 250, y: 50 },
      data: { label: 'Sleep Quality', type: 'lifestyle' },
      style: { width: 140 }
    },
    {
      id: 'activity',
      position: { x: 450, y: 50 },
      data: { label: 'Physical Activity', type: 'lifestyle' },
      style: { width: 140 }
    },
    {
      id: 'stress',
      position: { x: 250, y: 180 },
      data: { label: 'Stress Level', type: 'vital' },
      style: { width: 140 }
    },
    {
      id: 'weight',
      position: { x: 50, y: 180 },
      data: { label: 'Body Weight', type: 'vital' },
      style: { width: 140 }
    },
    {
      id: 'bmi',
      position: { x: 50, y: 310 },
      data: { label: 'BMI Marker', type: 'vital' },
      style: { width: 140 }
    },
    {
      id: 'glucose',
      position: { x: 250, y: 310 },
      data: { label: 'Blood Glucose', type: 'vital' },
      style: { width: 140 }
    },
    {
      id: 'bp',
      position: { x: 450, y: 180 },
      data: { label: 'Blood Pressure', type: 'vital' },
      style: { width: 140 }
    },
    {
      id: 'heartRisk',
      position: { x: 450, y: 400 },
      data: { label: 'Heart Risk', type: 'risk' },
      style: { width: 150 }
    },
    {
      id: 'diabetesRisk',
      position: { x: 150, y: 420 },
      data: { label: 'Diabetes Risk', type: 'risk' },
      style: { width: 150 }
    }
  ], []);

  // React Flow edges mapping relationships
  const initialEdges: Edge[] = useMemo(() => [
    { id: 'e-nut-glu', source: 'nutrition', target: 'glucose', animated: true },
    { id: 'e-nut-wei', source: 'nutrition', target: 'weight' },
    { id: 'e-sle-str', source: 'sleep', target: 'stress', animated: true },
    { id: 'e-sle-bp', source: 'sleep', target: 'bp' },
    { id: 'e-sle-hrk', source: 'sleep', target: 'heartRisk' },
    { id: 'e-str-bp', source: 'stress', target: 'bp', animated: true },
    { id: 'e-str-glu', source: 'stress', target: 'glucose' },
    { id: 'e-str-sle', source: 'stress', target: 'sleep' },
    { id: 'e-wei-bmi', source: 'weight', target: 'bmi' },
    { id: 'e-wei-bp', source: 'weight', target: 'bp' },
    { id: 'e-act-hrk', source: 'activity', target: 'heartRisk', animated: true },
    { id: 'e-act-drk', source: 'activity', target: 'diabetesRisk', animated: true },
    { id: 'e-act-str', source: 'activity', target: 'stress' },
    { id: 'e-bmi-drk', source: 'bmi', target: 'diabetesRisk' },
    { id: 'e-bmi-hrk', source: 'bmi', target: 'heartRisk' },
    { id: 'e-glu-drk', source: 'glucose', target: 'diabetesRisk', animated: true },
    { id: 'e-bp-hrk', source: 'bp', target: 'heartRisk', animated: true }
  ], []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Custom Node styles depending on category
  const renderCustomNode = useCallback((node: Node) => {
    const isSelected = selectedNodeId === node.id;
    const type = node.data.type;
    let nodeBg = 'border border-border/80 bg-card/60 backdrop-blur-md';
    let textColor = 'text-foreground';
    let indicatorColor = 'bg-slate-400';

    if (type === 'lifestyle') {
      indicatorColor = 'bg-sky-400';
    } else if (type === 'vital') {
      indicatorColor = 'bg-violet-400';
    } else if (type === 'risk') {
      indicatorColor = 'bg-amber-500 animate-pulse';
    }

    if (isSelected) {
      nodeBg = 'border-2 border-primary bg-primary/10 shadow-lg shadow-primary/20 backdrop-blur-md scale-105';
    }

    // Load actual dynamic values from the Context registry
    const registryInfo = nodeRegistry[node.id];
    const valText = registryInfo ? registryInfo.currentValue.split(' ')[0] : '';

    return (
      <div
        className={`px-4 py-2.5 rounded-2xl cursor-pointer text-left transition-all duration-200 ${nodeBg} ${textColor} flex items-center space-x-2.5`}
        onClick={() => setSelectedNodeId(node.id)}
      >
        <span className={`w-2 h-2 rounded-full ${indicatorColor}`}></span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider truncate leading-tight">
            {node.data.label as string}
          </p>
          <p className="text-xs font-black font-mono tracking-tighter mt-0.5">
            {valText || 'Metric'}
          </p>
        </div>
      </div>
    );
  }, [selectedNodeId, nodeRegistry]);

  // Render custom node layout mapped onto Flow Canvas
  const memoizedNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        label: renderCustomNode(node)
      }
    }));
  }, [nodes, renderCustomNode]);

  // Dynamically color edges connected to selected node
  const memoizedEdges = useMemo(() => {
    return edges.map((edge) => {
      const isConnected = edge.source === selectedNodeId || edge.target === selectedNodeId;
      return {
        ...edge,
        animated: edge.animated || isConnected,
        style: {
          stroke: isConnected ? 'rgb(168, 85, 247)' : 'rgba(255,255,255,0.05)',
          strokeWidth: isConnected ? 3 : 1.5,
          opacity: isConnected ? 1 : 0.4
        }
      };
    });
  }, [edges, selectedNodeId]);

  const activeNodeInfo = nodeRegistry[selectedNodeId];

  return (
    <div className="space-y-6">
      
      {/* Header Description */}
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight">Interactive Explanatory Health Graph</h2>
        <p className="text-sm text-muted-foreground">
          Map how habits, physical vitals, and genetic predispositions influence risk outputs. Click nodes to trace pathways.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Graph Canvas Panel (2/3 width) */}
        <div className="lg:col-span-2 bg-card/20 border border-border/50 rounded-3xl overflow-hidden h-[500px] relative shadow-inner">
          
          <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-none">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-400/10 text-sky-400 border border-sky-400/20">
              Lifestyle Nodes
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-400/10 text-violet-400 border border-violet-400/20">
              Vitals / Biomarkers
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
              Risk Outputs
            </span>
          </div>

          <ReactFlow
            nodes={memoizedNodes}
            edges={memoizedEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            connectionLineType={ConnectionLineType.SmoothStep}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            zoomOnScroll={false}
            preventScrolling={true}
          >
            <Background color="rgba(255,255,255,0.03)" gap={20} size={1} />
            <Controls showInteractive={false} className="!bg-card !border-border text-foreground" />
            <MiniMap 
              nodeColor={() => 'rgb(168, 85, 247)'}
              maskColor="rgba(0, 0, 0, 0.4)" 
              className="!bg-card !border-border"
            />
          </ReactFlow>
        </div>

        {/* Node Detail Explainer Panel (1/3 width) */}
        <div className="lg:col-span-1 bg-card/45 backdrop-blur-md border border-border/60 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col justify-between">
          
          {activeNodeInfo ? (
            <div className="space-y-6">
              
              {/* Node Header */}
              <div className="flex items-center space-x-3.5 border-b border-border/40 pb-4">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl border border-primary/20">
                  <activeNodeInfo.icon size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold leading-tight">{activeNodeInfo.name}</h3>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono tracking-wider">
                    Node ID: {activeNodeInfo.id}
                  </span>
                </div>
              </div>

              {/* Patient Value */}
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Patient Value</h4>
                <p className="text-sm font-black font-mono tracking-tight text-foreground bg-secondary/35 border border-border/40 rounded-xl p-2.5">
                  {activeNodeInfo.currentValue}
                </p>
              </div>

              {/* Bio Description */}
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Info size={11} /> Pathological Mechanism
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {activeNodeInfo.description}
                </p>
              </div>

              {/* Influence Strength / Risk */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-secondary/20 border border-border/30 rounded-xl">
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Influence weight</p>
                  <p className="text-xs font-black font-mono text-indigo-400 mt-0.5">{activeNodeInfo.influenceWeight}</p>
                </div>
                <div className="p-3 bg-secondary/20 border border-border/30 rounded-xl">
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Risk category</p>
                  <p className="text-xs font-black text-amber-400 mt-0.5 capitalize">{activeNodeInfo.id.includes('Risk') ? 'Output Node' : 'Predictor Node'}</p>
                </div>
              </div>

              {/* Connections List */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Connected Paths & Explanations</h4>
                {activeNodeInfo.connections.length > 0 ? (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {activeNodeInfo.connections.map((conn) => {
                      const details = nodeRegistry[conn.node];
                      return (
                        <div key={conn.node} className="p-2.5 bg-secondary/35 border border-border/40 rounded-xl text-[11px] flex items-center justify-between">
                          <div>
                            <span className="font-bold text-foreground">{details?.name || conn.node}</span>
                            <p className="text-[9px] text-muted-foreground italic mt-0.5">{conn.effect}</p>
                          </div>
                          <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                            conn.weight < 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {conn.weight > 0 ? `+${conn.weight}` : conn.weight}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No downstream edges connected (Terminal output node).</p>
                )}
              </div>

            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground text-xs">
              Select a node in the graph layout to inspect detailed model weights.
            </div>
          )}

          {/* Interactive helper badge */}
          <div className="mt-4 pt-3.5 border-t border-border/40 text-[10px] text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Fingerprint size={12} className="text-primary" /> Explainable Graph Engine v1.2
            </span>
            <span className="flex items-center gap-0.5 text-primary hover:underline cursor-pointer">
              Clinical Specs <ExternalLink size={10} />
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};
