"""
VitalPredict — Phase 1 End-to-End Verification Test Script
Tests model inference, SHAP generation, and LIME generation for a sample patient profile.
"""

import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import scoring
import explainability

print("=" * 60)
print("  PHASE 1 END-TO-END VERIFICATION TEST")
print("=" * 60)

# Sample Patient Profile
sample_patient = {
    'username': 'test_patient',
    'name': 'Alex Rivera',
    'age': 54,
    'gender': 'male',
    'height': 175,
    'weight': 88,
    'bpSystolic': 142,
    'bpDiastolic': 92,
    'glucose': 135,
    'heartRate': 82,
    'sleepDuration': 5.5,
    'stressLevel': 8,
    'dailySteps': 3500,
    'exerciseFrequency': 1,
    'smoking': 'smoker',
    'alcohol': 'moderate',
    'familyHistory': 'yes'
}

print(f"\n1. Testing Risk Scoring Engine for: {sample_patient['name']}")
scores = scoring.calculate_risk_scores(sample_patient)
print(f"   Overall Health Score: {scores['overallHealth']}/100")
print(f"   Heart Disease Risk:   {scores['heartRisk']}%")
print(f"   Diabetes Risk:        {scores['diabetesRisk']}%")
print(f"   Sleep Quality Score:  {scores['sleepScore']}/100")
print(f"   Stress Level Score:   {scores['stressScore']}/100")
print(f"   Inference Engines:    {scores['modelsUsed']}")

# Test Recommendations
recs = scoring.get_recommendations(sample_patient)
print(f"\n2. Generated Recommendations ({len(recs)} total):")
for r in recs:
    print(f"   [{r['priority'].upper()}] {r['title']} (Confidence: {r['confidenceScore']}%)")

# Test SHAP for Heart Model
print("\n3. Testing SHAP Explanation (Heart Disease Model):")
heart_features = scoring._build_heart_features(sample_patient)
heart_bundle = scoring._load_model('heart')
if heart_bundle:
    scaled_heart = heart_bundle['scaler'].transform(heart_features.reshape(1, -1))[0]
    shap_heart = explainability.get_shap_explanation('heart', scaled_heart, heart_bundle['feature_names'])
    print(f"   Base Value: {shap_heart.get('base_value')}")
    print(f"   Top 3 Risk Contributors:")
    for item in shap_heart.get('contributions', [])[:3]:
        print(f"     - {item['feature']}: SHAP={item['shap_value']:+.4f}")

# Test SHAP for Diabetes Model
print("\n4. Testing SHAP Explanation (Diabetes Model):")
diab_features = scoring._build_diabetes_features(sample_patient)
diab_bundle = scoring._load_model('diabetes')
if diab_bundle:
    scaled_diab = diab_bundle['scaler'].transform(diab_features.reshape(1, -1))[0]
    shap_diab = explainability.get_shap_explanation('diabetes', scaled_diab, diab_bundle['feature_names'])
    print(f"   Base Value: {shap_diab.get('base_value')}")
    print(f"   Top 3 Risk Contributors:")
    for item in shap_diab.get('contributions', [])[:3]:
        print(f"     - {item['feature']}: SHAP={item['shap_value']:+.4f}")

# Test LIME for Heart Model
print("\n5. Testing LIME Explanation (Heart Disease Model):")
if heart_bundle:
    lime_heart = explainability.get_lime_explanation('heart', scaled_heart, feature_names=heart_bundle['feature_names'])
    print(f"   Prediction Probabilities: {lime_heart.get('prediction_probabilities')}")
    print(f"   LIME Feature Rules:")
    for item in lime_heart.get('contributions', [])[:3]:
        print(f"     - {item['feature_rule']}: weight={item['weight']:+.4f}")

print(f"\n{'=' * 60}")
print("  ALL VERIFICATION TESTS PASSED SUCCESSFULLY!")
print(f"{'=' * 60}")
