import os
import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./vitalpredict.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    username = Column(String, primary_key=True, index=True)
    password = Column(String)  # Simple text password for ease of prototyping
    name = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class HealthData(Base):
    __tablename__ = "health_data"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    age = Column(Float)
    gender = Column(String)
    height = Column(Float)
    weight = Column(Float)
    bpSystolic = Column(Float)
    bpDiastolic = Column(Float)
    glucose = Column(Float)
    heartRate = Column(Float)
    sleepDuration = Column(Float)
    stressLevel = Column(Float)
    dailySteps = Column(Float)
    exerciseFrequency = Column(Float)
    smoking = Column(String)
    alcohol = Column(String)
    familyHistory = Column(String)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class VitalsHistory(Base):
    __tablename__ = "vitals_history"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)
    age = Column(Float)
    weight = Column(Float)
    bp_systolic = Column(Float)
    bp_diastolic = Column(Float)
    glucose = Column(Float)
    heart_rate = Column(Float)
    sleep_duration = Column(Float)
    stress_level = Column(Float)
    daily_steps = Column(Float)
    exercise_frequency = Column(Float)
    overall_health = Column(Float)
    heart_risk = Column(Float)
    diabetes_risk = Column(Float)
    sleep_score = Column(Float)
    stress_score = Column(Float)
    notes = Column(String, nullable=True)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
