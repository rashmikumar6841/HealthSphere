"""
VitalPredict — Diabetes Prediction Model Training Script
Trains an XGBoost classifier on the Pima Indians diabetes dataset.
Saves: diabetes_model.joblib, diabetes_scaler.joblib, diabetes_feature_names.joblib
"""

import os
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, classification_report, confusion_matrix
)
from xgboost import XGBClassifier

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'diabetes.csv')  # Use raw data, we control scaling
MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')
os.makedirs(MODELS_DIR, exist_ok=True)


def train():
    print("=" * 60)
    print("  DIABETES PREDICTION MODEL TRAINING")
    print("=" * 60)

    # Load raw data
    df = pd.read_csv(DATA_PATH)
    print(f"\nDataset shape: {df.shape}")
    print(f"Target distribution:\n{df['Outcome'].value_counts()}\n")

    # Handle biologically impossible zeros by replacing with NaN and imputing
    zero_cols = ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI']
    for col in zero_cols:
        df[col] = df[col].replace(0, np.nan)
        df[col] = df[col].fillna(df.groupby('Outcome')[col].transform('median'))

    print(f"After zero-imputation: {df.shape}")

    # Separate features and target
    feature_cols = [c for c in df.columns if c != 'Outcome']
    X = df[feature_cols].values
    y = df['Outcome'].values

    # Scale features
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)

    # Train/Test split (stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Train: {X_train.shape[0]}, Test: {X_test.shape[0]}")

    # Train XGBoost
    model = XGBClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=len(y[y == 0]) / len(y[y == 1]),  # Handle class imbalance
        random_state=42,
        eval_metric='logloss'
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)

    print(f"\n--- Test Set Performance ---")
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"AUC-ROC:   {auc:.4f}")
    print(f"\nClassification Report:\n{classification_report(y_test, y_pred)}")
    print(f"Confusion Matrix:\n{confusion_matrix(y_test, y_pred)}")

    # Cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X_scaled, y, cv=cv, scoring='accuracy')
    print(f"\n5-Fold CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

    # Save model, scaler, and feature names
    joblib.dump(model, os.path.join(MODELS_DIR, 'diabetes_model.joblib'))
    joblib.dump(scaler, os.path.join(MODELS_DIR, 'diabetes_scaler.joblib'))
    joblib.dump(feature_cols, os.path.join(MODELS_DIR, 'diabetes_feature_names.joblib'))

    print(f"\n[OK] Model saved to: {os.path.join(MODELS_DIR, 'diabetes_model.joblib')}")
    print(f"[OK] Scaler saved to: {os.path.join(MODELS_DIR, 'diabetes_scaler.joblib')}")
    print(f"[OK] Feature names saved to: {os.path.join(MODELS_DIR, 'diabetes_feature_names.joblib')}")

    return {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1,
        'auc': auc,
        'cv_mean': cv_scores.mean(),
        'cv_std': cv_scores.std()
    }


if __name__ == '__main__':
    metrics = train()
    print(f"\n{'=' * 60}")
    print("  TRAINING COMPLETE")
    print(f"{'=' * 60}")
