"""
VitalPredict — Explainability Module (SHAP & LIME)
Generates per-patient feature attributions using SHAP TreeExplainer
and LIME TabularExplainer for each trained model.
"""

import os
import numpy as np
import joblib
import logging

logger = logging.getLogger(__name__)

MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')


def _load_model_artifacts(model_name: str):
    """Load model, scaler, and feature names for a given model."""
    model_path = os.path.join(MODELS_DIR, f'{model_name}_model.joblib')
    scaler_path = os.path.join(MODELS_DIR, f'{model_name}_scaler.joblib')
    features_path = os.path.join(MODELS_DIR, f'{model_name}_feature_names.joblib')

    if not os.path.exists(model_path):
        return None, None, None

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path) if os.path.exists(scaler_path) else None
    feature_names = joblib.load(features_path) if os.path.exists(features_path) else None

    return model, scaler, feature_names


def get_shap_explanation(model_name: str, feature_vector: np.ndarray, feature_names: list = None) -> dict:
    """
    Compute SHAP values for a single patient's feature vector.

    Args:
        model_name: 'heart', 'diabetes', or 'sleep'
        feature_vector: 1D numpy array of scaled feature values
        feature_names: list of feature names corresponding to the vector

    Returns:
        dict with 'shap_values', 'base_value', 'features' for the positive class
    """
    try:
        import shap

        model, scaler, stored_names = _load_model_artifacts(model_name)
        if model is None:
            return {'error': f'Model {model_name} not found'}

        names = feature_names or stored_names or [f'feature_{i}' for i in range(len(feature_vector))]

        # Reshape for single sample
        X = feature_vector.reshape(1, -1)

        # Create SHAP explainer
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X)

        # For binary classification, shap_values may be a list [class_0, class_1]
        # For multi-class (sleep), it's a list of arrays per class
        if isinstance(shap_values, list):
            if model_name == 'sleep':
                # Multi-class: return SHAP values for all classes
                result = {
                    'model': model_name,
                    'type': 'multi_class',
                    'classes': ['Healthy', 'Insomnia', 'Sleep Apnea'],
                    'base_values': [],
                    'shap_per_class': []
                }
                for cls_idx in range(len(shap_values)):
                    sv = shap_values[cls_idx][0]
                    contributions = []
                    for i, (name, val) in enumerate(zip(names, sv)):
                        contributions.append({
                            'feature': str(name),
                            'shap_value': round(float(val), 6),
                            'abs_importance': round(abs(float(val)), 6)
                        })
                    contributions.sort(key=lambda x: x['abs_importance'], reverse=True)
                    result['shap_per_class'].append(contributions)

                if hasattr(explainer, 'expected_value'):
                    ev = explainer.expected_value
                    if isinstance(ev, (list, np.ndarray)):
                        result['base_values'] = [round(float(v), 6) for v in ev]
                    else:
                        result['base_values'] = [round(float(ev), 6)]

                return result
            else:
                # Binary: use positive class (index 1)
                sv = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
                base_val = explainer.expected_value
                if isinstance(base_val, (list, np.ndarray)):
                    base_val = base_val[1] if len(base_val) > 1 else base_val[0]
        else:
            sv = shap_values[0]
            base_val = explainer.expected_value
            if isinstance(base_val, (list, np.ndarray)):
                base_val = base_val[0]

        # Build contribution list sorted by absolute importance
        contributions = []
        for i, (name, val) in enumerate(zip(names, sv)):
            contributions.append({
                'feature': str(name),
                'shap_value': round(float(val), 6),
                'abs_importance': round(abs(float(val)), 6)
            })
        contributions.sort(key=lambda x: x['abs_importance'], reverse=True)

        return {
            'model': model_name,
            'type': 'binary',
            'base_value': round(float(base_val), 6),
            'contributions': contributions,
            'top_risk_factors': [c for c in contributions[:5] if c['shap_value'] > 0],
            'top_protective_factors': [c for c in contributions if c['shap_value'] < 0][:3]
        }

    except Exception as e:
        logger.error(f"SHAP explanation failed for {model_name}: {e}")
        return {'error': str(e)}


def get_lime_explanation(model_name: str, feature_vector: np.ndarray,
                         training_data: np.ndarray = None, feature_names: list = None,
                         num_features: int = 8) -> dict:
    """
    Generate LIME explanation for a single prediction.

    Args:
        model_name: 'heart', 'diabetes', or 'sleep'
        feature_vector: 1D numpy array of scaled feature values
        training_data: 2D array of training data for LIME's background
        feature_names: list of feature names
        num_features: number of top features to explain

    Returns:
        dict with feature contributions and prediction probabilities
    """
    try:
        import lime
        import lime.lime_tabular

        model, scaler, stored_names = _load_model_artifacts(model_name)
        if model is None:
            return {'error': f'Model {model_name} not found'}

        names = feature_names or stored_names or [f'feature_{i}' for i in range(len(feature_vector))]

        # If no training data provided, create synthetic background
        if training_data is None:
            rng = np.random.RandomState(42)
            training_data = rng.randn(100, len(feature_vector)) * 0.5 + feature_vector

        class_names = ['Low Risk', 'High Risk']
        mode = 'classification'
        if model_name == 'sleep':
            class_names = ['Healthy', 'Insomnia', 'Sleep Apnea']

        explainer = lime.lime_tabular.LimeTabularExplainer(
            training_data,
            feature_names=[str(n) for n in names],
            class_names=class_names,
            mode=mode,
            random_state=42
        )

        explanation = explainer.explain_instance(
            feature_vector,
            model.predict_proba,
            num_features=num_features
        )

        # Extract explanation data
        contributions = []
        for feature_desc, weight in explanation.as_list():
            contributions.append({
                'feature_rule': feature_desc,
                'weight': round(float(weight), 6),
                'direction': 'risk' if weight > 0 else 'protective'
            })

        # Get prediction probabilities
        proba = model.predict_proba(feature_vector.reshape(1, -1))[0]

        # Extract intercept safely
        intercept_val = 0.0
        if hasattr(explanation, 'intercept') and explanation.intercept is not None:
            if isinstance(explanation.intercept, (list, np.ndarray, dict)):
                try:
                    intercept_val = float(explanation.intercept[1])
                except (KeyError, IndexError):
                    intercept_val = float(list(explanation.intercept.values())[0] if isinstance(explanation.intercept, dict) else explanation.intercept[0])
            else:
                intercept_val = float(explanation.intercept)

        return {
            'model': model_name,
            'prediction_probabilities': {
                class_names[i]: round(float(p), 4) for i, p in enumerate(proba)
            },
            'contributions': contributions,
            'intercept': round(intercept_val, 6)
        }

    except Exception as e:
        logger.error(f"LIME explanation failed for {model_name}: {e}")
        return {'error': str(e)}
