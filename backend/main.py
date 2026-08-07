import logging
import time
from typing import List, Dict, Any
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

# Import relative components
import database
import graph
import scoring
import explainability

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="VitalPredict Backend Service")

# CORS Middleware for local React development connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Seeding and Table Init
@app.on_event("startup")
def startup_db_client():
    logger.info("Starting up database integrations...")
    database.init_db()
    try:
        graph.init_graph()
    except Exception as e:
        logger.error(f"Error seeding Neo4j Graph elements: {e}")

# Connection Manager for WebSockets
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New WebSocket client connected. Active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"WebSocket client disconnected. Active connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Failed to broadcast websocket package: {e}")

manager = ConnectionManager()

# Pydantic Schemas
class HealthDataSchema(BaseModel):
    age: float
    gender: str
    height: float
    weight: float
    bpSystolic: float
    bpDiastolic: float
    glucose: float
    heartRate: float
    sleepDuration: float
    stressLevel: float
    dailySteps: float
    exerciseFrequency: float
    smoking: str
    alcohol: str
    familyHistory: str

class RegisterSchema(BaseModel):
    username: str
    password: str
    name: str
    age: float
    gender: str
    height: float
    weight: float
    bpSystolic: float
    bpDiastolic: float
    glucose: float
    heartRate: float
    sleepDuration: float
    stressLevel: float
    dailySteps: float
    exerciseFrequency: float
    smoking: str
    alcohol: str
    familyHistory: str

class LoginSchema(BaseModel):
    username: str
    password: str

class SQLQuerySchema(BaseModel):
    query: str

# API Routes

@app.post("/api/register")
async def register_user(payload: RegisterSchema, db: Session = Depends(database.get_db)):
    # Check if user already exists
    existing = db.query(database.User).filter_by(username=payload.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username is already taken")
        
    # Create user credentials
    new_user = database.User(
        username=payload.username,
        password=payload.password,  # Stored in plaintext for prototyping
        name=payload.name
    )
    db.add(new_user)
    
    # Create health profile
    profile = database.HealthData(
        username=payload.username,
        age=payload.age,
        gender=payload.gender,
        height=payload.height,
        weight=payload.weight,
        bpSystolic=payload.bpSystolic,
        bpDiastolic=payload.bpDiastolic,
        glucose=payload.glucose,
        heartRate=payload.heartRate,
        sleepDuration=payload.sleepDuration,
        stressLevel=payload.stressLevel,
        dailySteps=payload.dailySteps,
        exerciseFrequency=payload.exerciseFrequency,
        smoking=payload.smoking,
        alcohol=payload.alcohol,
        familyHistory=payload.familyHistory
    )
    db.add(profile)
    db.commit()
    
    # Calculate scores
    profile_dict = {k: v for k, v in profile.__dict__.items() if not k.startswith('_')}
    scores = scoring.calculate_risk_scores(profile_dict)
    recommendations = scoring.get_recommendations(profile_dict)
    
    # Log initial historical snapshot record
    history_log = database.VitalsHistory(
        username=payload.username,
        age=profile.age,
        weight=profile.weight,
        bp_systolic=profile.bpSystolic,
        bp_diastolic=profile.bpDiastolic,
        glucose=profile.glucose,
        heart_rate=profile.heartRate,
        sleep_duration=profile.sleepDuration,
        stress_level=profile.stressLevel,
        daily_steps=profile.dailySteps,
        exercise_frequency=profile.exerciseFrequency,
        overall_health=scores['overallHealth'],
        heart_risk=scores['heartRisk'],
        diabetes_risk=scores['diabetesRisk'],
        sleep_score=scores['sleepScore'],
        stress_score=scores['stressScore'],
        notes="Profile initialized during registration."
    )
    db.add(history_log)
    db.commit()
    
    # Update Neo4j graph nodes properties
    try:
        graph.update_graph_vitals(payload.username, payload.name, profile_dict, scores)
    except Exception as e:
        logger.error(f"Failed to seed user Neo4j graph structure: {e}")
        
    return {
        "status": "success",
        "username": payload.username,
        "name": payload.name,
        "healthData": profile_dict,
        "currentScores": scores,
        "recommendations": recommendations
    }

@app.post("/api/login")
def login_user(payload: LoginSchema, db: Session = Depends(database.get_db)):
    user = db.query(database.User).filter_by(username=payload.username).first()
    if not user or user.password != payload.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    # Load profile details
    profile = db.query(database.HealthData).filter_by(username=payload.username).first()
    profile_dict = {}
    scores = {}
    recommendations = []
    
    if profile:
        profile_dict = {k: v for k, v in profile.__dict__.items() if not k.startswith('_')}
        scores = scoring.calculate_risk_scores(profile_dict)
        recommendations = scoring.get_recommendations(profile_dict)
        
    return {
        "status": "success",
        "username": user.username,
        "name": user.name,
        "healthData": profile_dict,
        "currentScores": scores,
        "recommendations": recommendations
    }

@app.get("/api/health-data")
def get_health_data(username: str, db: Session = Depends(database.get_db)):
    profile = db.query(database.HealthData).filter_by(username=username).first()
    if not profile:
        # Auto-initialize user if missing
        user = db.query(database.User).filter_by(username=username).first()
        if not user:
            user = database.User(username=username, password="password", name=username.capitalize())
            db.add(user)
            
        profile = database.HealthData(
            username=username,
            age=45,
            gender="male",
            height=172,
            weight=75,
            bpSystolic=120,
            bpDiastolic=80,
            glucose=95,
            heartRate=72,
            sleepDuration=7.5,
            stressLevel=4,
            dailySteps=7500,
            exerciseFrequency=3,
            smoking="non-smoker",
            alcohol="none",
            familyHistory="no"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

        # Create initial history log
        p_dict = {k: v for k, v in profile.__dict__.items() if not k.startswith('_')}
        scores = scoring.calculate_risk_scores(p_dict)
        history_log = database.VitalsHistory(
            username=username,
            age=profile.age,
            weight=profile.weight,
            bp_systolic=profile.bpSystolic,
            bp_diastolic=profile.bpDiastolic,
            glucose=profile.glucose,
            heart_rate=profile.heartRate,
            sleep_duration=profile.sleepDuration,
            stress_level=profile.stressLevel,
            daily_steps=profile.dailySteps,
            exercise_frequency=profile.exerciseFrequency,
            overall_health=scores['overallHealth'],
            heart_risk=scores['heartRisk'],
            diabetes_risk=scores['diabetesRisk'],
            sleep_score=scores['sleepScore'],
            stress_score=scores['stressScore'],
            notes="Initial profile created."
        )
        db.add(history_log)
        db.commit()
        
    profile_dict = {k: v for k, v in profile.__dict__.items() if not k.startswith('_')}
    scores = scoring.calculate_risk_scores(profile_dict)
    recommendations = scoring.get_recommendations(profile_dict)
    
    return {
        "healthData": profile_dict,
        "currentScores": scores,
        "recommendations": recommendations
    }

@app.post("/api/health-data")
async def update_health_data(username: str, payload: HealthDataSchema, db: Session = Depends(database.get_db)):
    user = db.query(database.User).filter_by(username=username).first()
    if not user:
        user = database.User(username=username, password="password", name=username.capitalize())
        db.add(user)
        
    profile = db.query(database.HealthData).filter_by(username=username).first()
    if not profile:
        profile = database.HealthData(username=username)
        db.add(profile)
        
    # Update properties
    data_dict = payload.dict()
    for key, value in data_dict.items():
        setattr(profile, key, value)
        
    db.commit()
    db.refresh(profile)
    
    # Recalculate scores and recommendations
    profile_dict = {k: v for k, v in profile.__dict__.items() if not k.startswith('_')}
    scores = scoring.calculate_risk_scores(profile_dict)
    recommendations = scoring.get_recommendations(profile_dict)
    
    # Save a record to history timeline log
    history_log = database.VitalsHistory(
        username=username,
        age=profile.age,
        weight=profile.weight,
        bp_systolic=profile.bpSystolic,
        bp_diastolic=profile.bpDiastolic,
        glucose=profile.glucose,
        heart_rate=profile.heartRate,
        sleep_duration=profile.sleepDuration,
        stress_level=profile.stressLevel,
        daily_steps=profile.dailySteps,
        exercise_frequency=profile.exerciseFrequency,
        overall_health=scores['overallHealth'],
        heart_risk=scores['heartRisk'],
        diabetes_risk=scores['diabetesRisk'],
        sleep_score=scores['sleepScore'],
        stress_score=scores['stressScore'],
        notes="Automated snapshot logged after profile metrics update."
    )
    db.add(history_log)
    db.commit()
    
    # Update Neo4j graph nodes properties
    try:
        graph.update_graph_vitals(username, user.name, profile_dict, scores)
    except Exception as e:
        logger.error(f"Failed to update Neo4j node properties during post: {e}")
        
    # Broadcast updates over WebSockets in real-time
    ws_payload = {
        "type": "VITALS_UPDATE",
        "username": username,
        "healthData": profile_dict,
        "currentScores": scores,
        "recommendations": recommendations
    }
    await manager.broadcast(ws_payload)
    
    return ws_payload

@app.get("/api/history")
def get_vitals_history(username: str, db: Session = Depends(database.get_db)):
    logs = db.query(database.VitalsHistory).filter_by(username=username).order_by(database.VitalsHistory.recorded_at.asc()).all()
    history_list = []
    for log in logs:
        day_label = log.recorded_at.strftime("%b %d") if log.recorded_at else "Now"
        history_list.append({
            "id": log.id,
            "recorded_at": log.recorded_at.isoformat() if log.recorded_at else "",
            "day": day_label,
            "age": log.age,
            "weight": log.weight,
            "bp": f"{int(log.bp_systolic)}/{int(log.bp_diastolic)}",
            "bpSystolic": log.bp_systolic,
            "bpDiastolic": log.bp_diastolic,
            "glucose": log.glucose,
            "heart_rate": log.heart_rate,
            "sleep_duration": log.sleep_duration,
            "sleepHours": log.sleep_duration,
            "stress_level": log.stress_level,
            "daily_steps": log.daily_steps,
            "steps": log.daily_steps,
            "exercise_frequency": log.exercise_frequency,
            "scores": {
                "overallHealth": log.overall_health,
                "heartRisk": log.heart_risk,
                "diabetesRisk": log.diabetes_risk,
                "sleepScore": log.sleep_score,
                "stressScore": log.stress_score,
            },
            "notes": log.notes
        })
    return history_list

@app.get("/api/graph")
def get_neo4j_graph(username: str):
    graph_data = graph.get_graph_data(username)
    if not graph_data:
        # Fallback simulated response if Neo4j is offline or empty
        return {
            "nodes": [
                {"id": "sleep", "name": "Sleep Quality", "group": "lifestyle", "properties": {"value": 7.0, "score": 75}},
                {"id": "stress", "name": "Stress Level", "group": "vital", "properties": {"value": 5.0, "score": 50}},
                {"id": "weight", "name": "Body Weight", "group": "vital", "properties": {"value": 70.0}},
                {"id": "glucose", "name": "Blood Glucose", "group": "vital", "properties": {"value": 90.0}},
                {"id": "bp", "name": "Blood Pressure", "group": "vital", "properties": {"value": "120/80"}},
                {"id": "heartRisk", "name": "Heart Risk", "group": "risk", "properties": {"value": 10}},
                {"id": "diabetesRisk", "name": "Diabetes Risk", "group": "risk", "properties": {"value": 8}}
            ],
            "relationships": [
                {"source": "sleep", "target": "stress", "type": "REGULATES_CORTISOL", "weight": -0.65},
                {"source": "stress", "target": "bp", "type": "SYMPATHETIC_TENSION", "weight": 0.55},
                {"source": "weight", "target": "bp", "type": "VASCULAR_COMPRESSION", "weight": 0.45},
                {"source": "bp", "target": "heartRisk", "type": "MYOCARDIAL_LOAD", "weight": 0.70},
                {"source": "glucose", "target": "diabetesRisk", "type": "GLYCEMIC_BURDEN", "weight": 0.85}
            ]
        }
    return graph_data

@app.post("/api/query/postgres")
def execute_postgres_query(payload: SQLQuerySchema, db: Session = Depends(database.get_db)):
    query_str = payload.query.strip()
    
    # Read-only query filter validation for basic security
    lowered = query_str.lower()
    for forbidden in ["delete", "drop", "truncate", "update", "insert", "alter", "create"]:
        if forbidden in lowered:
            raise HTTPException(status_code=400, detail=f"Operation '{forbidden.upper()}' is forbidden in SQL console.")
            
    start = time.perf_counter()
    try:
        result = db.execute(text(query_str))
        
        if result.returns_rows:
            columns = list(result.keys())
            rows = []
            for row in result.all():
                processed_row = []
                for val in row:
                    if hasattr(val, 'isoformat'):
                        processed_row.append(val.isoformat())
                    else:
                        processed_row.append(val)
                rows.append(processed_row)
        else:
            columns = ["status"]
            rows = [[f"Query completed successfully. Affected rows: {result.rowcount}"]]
            
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database execution error: {str(e)}")
        
    end = time.perf_counter()
    return {
        "columns": columns,
        "rows": rows,
        "executionTimeMs": round((end - start) * 1000, 2)
    }

@app.get("/api/explain")
def get_explanation(username: str, model: str = "heart", db: Session = Depends(database.get_db)):
    """Get SHAP explanation for a patient's prediction from a specific model."""
    import numpy as np
    
    if model not in ['heart', 'diabetes', 'sleep']:
        raise HTTPException(status_code=400, detail="Model must be 'heart', 'diabetes', or 'sleep'")
    
    profile = db.query(database.HealthData).filter_by(username=username).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    
    profile_dict = {k: v for k, v in profile.__dict__.items() if not k.startswith('_')}
    
    # Build feature vector for the requested model
    if model == 'heart':
        features = scoring._build_heart_features(profile_dict)
        bundle = scoring._load_model('heart')
    elif model == 'diabetes':
        features = scoring._build_diabetes_features(profile_dict)
        bundle = scoring._load_model('diabetes')
    else:
        features = scoring._build_sleep_features(profile_dict)
        bundle = scoring._load_model('sleep')
    
    if bundle is None:
        raise HTTPException(status_code=503, detail=f"Model '{model}' is not loaded. Train it first.")
    
    # Scale features
    scaled = bundle['scaler'].transform(features.reshape(1, -1))[0]
    feature_names = bundle['feature_names']
    
    # Get SHAP explanation
    shap_result = explainability.get_shap_explanation(model, scaled, feature_names)
    
    # Get prediction
    scores = scoring.calculate_risk_scores(profile_dict)
    
    return {
        "model": model,
        "scores": scores,
        "shap": shap_result
    }

@app.get("/api/models/status")
def get_models_status():
    """Check which ML models are available and loaded."""
    import os
    models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')
    status = {}
    for name in ['heart', 'diabetes', 'sleep']:
        model_path = os.path.join(models_dir, f'{name}_model.joblib')
        status[name] = {
            'available': os.path.exists(model_path),
            'loaded': name in scoring._model_cache and scoring._model_cache[name] is not None
        }
    return status

# WebSockets Endpoint
@app.websocket("/ws/vitals")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket encounter error: {e}")
        manager.disconnect(websocket)
