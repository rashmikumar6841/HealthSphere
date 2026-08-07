"""
VitalPredict — Sleep Quality Prediction Model Training Script
Trains a Random Forest classifier on the sleep health and lifestyle dataset.
Multi-class: 0=None, 1=Insomnia, 2=Sleep Apnea
Saves: sleep_model.joblib, sleep_scaler.joblib, sleep_feature_names.joblib
"""

import os
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import MinMaxScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, f1_score, classification_report, confusion_matrix
)

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'Sleep_health_and_lifestyle_dataset.csv')  # Use raw
MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')
os.makedirs(MODELS_DIR, exist_ok=True)


def train():
    print("=" * 60)
    print("  SLEEP QUALITY MODEL TRAINING")
    print("=" * 60)

    # Load raw data
    df = pd.read_csv(DATA_PATH)
    print(f"\nRaw dataset shape: {df.shape}")

    # --- Preprocessing (replicate notebook steps on raw data) ---

    # Fill Sleep Disorder NaN with 'None'
    df['Sleep Disorder'] = df['Sleep Disorder'].fillna('None')

    # Split Blood Pressure into systolic/diastolic
    df[['bp_systolic', 'bp_diastolic']] = df['Blood Pressure'].str.split('/', expand=True).astype(int)
    df.drop('Blood Pressure', axis=1, inplace=True)

    # Drop Person ID
    df.drop('Person ID', axis=1, inplace=True)

    # Drop duplicates
    df.drop_duplicates(inplace=True)

    # Ordinal encode BMI Category
    bmi_mapping = {"Normal": 0, "Normal Weight": 0, "Overweight": 1, "Obese": 2}
    df['BMI Category'] = df['BMI Category'].map(bmi_mapping)

    # One-hot encode Gender and Occupation
    df = pd.get_dummies(df, columns=['Gender', 'Occupation'], drop_first=True)

    # Label encode target
    disorder_mapping = {"None": 0, "Insomnia": 1, "Sleep Apnea": 2}
    df['Sleep Disorder'] = df['Sleep Disorder'].map(disorder_mapping)

    print(f"Processed dataset shape: {df.shape}")
    print(f"Target distribution:\n{df['Sleep Disorder'].value_counts()}\n")

    # Separate features and target
    feature_cols = [c for c in df.columns if c != 'Sleep Disorder']
    X = df[feature_cols].values
    y = df['Sleep Disorder'].values

    # Scale features
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)

    # Train/Test split (stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Train: {X_train.shape[0]}, Test: {X_test.shape[0]}")

    # Train Random Forest (multi-class)
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    f1_macro = f1_score(y_test, y_pred, average='macro')
    f1_weighted = f1_score(y_test, y_pred, average='weighted')

    target_names = ['None (Healthy)', 'Insomnia', 'Sleep Apnea']
    print(f"\n--- Test Set Performance ---")
    print(f"Accuracy:     {accuracy:.4f}")
    print(f"F1 (macro):   {f1_macro:.4f}")
    print(f"F1 (weighted): {f1_weighted:.4f}")
    print(f"\nClassification Report:\n{classification_report(y_test, y_pred, target_names=target_names)}")
    print(f"Confusion Matrix:\n{confusion_matrix(y_test, y_pred)}")

    # Cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X_scaled, y, cv=cv, scoring='accuracy')
    print(f"\n5-Fold CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

    # Save model, scaler, and feature names
    joblib.dump(model, os.path.join(MODELS_DIR, 'sleep_model.joblib'))
    joblib.dump(scaler, os.path.join(MODELS_DIR, 'sleep_scaler.joblib'))
    joblib.dump(feature_cols, os.path.join(MODELS_DIR, 'sleep_feature_names.joblib'))

    print(f"\n[OK] Model saved to: {os.path.join(MODELS_DIR, 'sleep_model.joblib')}")
    print(f"[OK] Scaler saved to: {os.path.join(MODELS_DIR, 'sleep_scaler.joblib')}")
    print(f"[OK] Feature names saved to: {os.path.join(MODELS_DIR, 'sleep_feature_names.joblib')}")

    return {
        'accuracy': accuracy,
        'f1_macro': f1_macro,
        'f1_weighted': f1_weighted,
        'cv_mean': cv_scores.mean(),
        'cv_std': cv_scores.std()
    }


if __name__ == '__main__':
    metrics = train()
    print(f"\n{'=' * 60}")
    print("  TRAINING COMPLETE")
    print(f"{'=' * 60}")
