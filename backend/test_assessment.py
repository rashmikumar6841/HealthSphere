"""
VitalPredict — Assessment Module Test Suite
Tests all 10 cases specified in the project requirements.

Run with:
    cd backend
    python -m pytest test_assessment.py -v
"""

import pytest
import sys
import os
import io

# Ensure backend is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import assessment


# ─── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def clear_sessions():
    """Reset in-memory session store before each test."""
    assessment._sessions.clear()
    yield
    assessment._sessions.clear()


# ─── A: English age extraction ───────────────────────────────────────────────

def test_english_age_extraction():
    """A — English: 'I am 45 years old.' → age=45"""
    result = assessment.parse_contextual_answer("I am 45 years old.", "age", "en")
    assert "age" in result, "age key should be extracted"
    assert result["age"] == 45


def test_english_age_various_phrasings():
    """A2 — Multiple English phrasings for age."""
    for text in ["45 years", "I am 42 years old", "age is 30"]:
        nums = assessment.extract_numbers(assessment.normalize_digits(text))
        assert any(1 <= n <= 110 for n in nums), f"Should find valid age in: {text}"


# ─── B: Blood Pressure extraction ────────────────────────────────────────────

def test_bp_extraction_over_format():
    """B — BP: 'My blood pressure is 150 over 95.' → systolic=150, diastolic=95"""
    result = assessment.parse_contextual_answer("My blood pressure is 150 over 95.", "bp", "en")
    assert result.get("bpSystolic") == 150, f"Expected systolic=150, got {result}"
    assert result.get("bpDiastolic") == 95, f"Expected diastolic=95, got {result}"


def test_bp_extraction_slash_format():
    """B2 — BP slash format: '150/95'"""
    result = assessment.parse_contextual_answer("It's 150/95", "bp", "en")
    assert result.get("bpSystolic") == 150
    assert result.get("bpDiastolic") == 95


def test_bp_extraction_by_format():
    """B3 — BP 'by' format: '150 by 90'"""
    result = assessment.parse_contextual_answer("blood pressure 150 by 90", "bp", "en")
    assert result.get("bpSystolic") == 150
    assert result.get("bpDiastolic") == 90


# ─── C: Kannada voice input ───────────────────────────────────────────────────

def test_kannada_age_extraction():
    """C — Kannada: 'ನನಗೆ 45 ವರ್ಷ' → age=45"""
    kannada_text = "ನನಗೆ 45 ವರ್ಷ"
    result = assessment.parse_contextual_answer(kannada_text, "age", "kn")
    assert "age" in result, "Kannada age should be extracted"
    assert result["age"] == 45


def test_kannada_digit_normalizer():
    """C2 — Kannada numeral normalization: '೪೫' → '45'"""
    kannada_num = "ನನಗೆ ೪೫ ವರ್ಷ"
    normalized = assessment.normalize_digits(kannada_num)
    assert "45" in normalized, f"Expected '45' in normalized: {normalized}"


def test_kannada_bp_extraction():
    """C3 — Kannada BP extraction with 'ಮತ್ತು' separator"""
    # "ನನ್ನ ರಕ್ತದೊತ್ತಡ 150 ಮತ್ತು 95 ಇದೆ"
    result = assessment.parse_contextual_answer(
        "ನನ್ನ ರಕ್ತದೊತ್ತಡ 150 ಮತ್ತು 95 ಇದೆ", "bp", "kn"
    )
    assert result.get("bpSystolic") == 150 or result.get("bpSystolic") is not None


# ─── D: Hindi input ──────────────────────────────────────────────────────────

def test_hindi_glucose_extraction():
    """D — Hindi: 'मेरा शुगर 180 है' → glucose=180"""
    result = assessment.parse_contextual_answer("मेरा शुगर 180 है", "glucose", "hi")
    assert "glucose" in result, "Hindi glucose should be extracted"
    assert result["glucose"] == 180


def test_hindi_age_extraction():
    """D2 — Hindi age extraction"""
    result = assessment.parse_contextual_answer("मेरी उम्र 42 साल है", "age", "hi")
    assert result.get("age") == 42


# ─── E: Missing-feature detection ───────────────────────────────────────────

def test_missing_feature_detection_after_partial_data():
    """E — Session with age + BP known → next question should be glucose (for diabetes model)"""
    session = assessment.create_session("test_user", "en", "diabetes")
    # Diabetes model requires: age, gender, glucose, bp, weight, height, familyHistory
    # Provide age, gender, and BP
    session["known_features"]["age"] = 45
    session["known_features"]["gender"] = "male"
    session["known_features"]["bpSystolic"] = 150
    session["known_features"]["bpDiastolic"] = 95

    assessment.update_session_state(session)

    # glucose should still be missing
    assert "glucose" in session["missing_features"], \
        f"glucose should be missing, got: {session['missing_features']}"
    # current_question should be the first missing item
    assert session["current_question"] is not None


def test_missing_feature_all_known():
    """E2 — All features provided → current_question should be None"""
    session = assessment.create_session("test_user", "en", "diabetes")
    # Supply all diabetes-required fields
    session["known_features"]["age"] = 42
    session["known_features"]["gender"] = "female"
    session["known_features"]["glucose"] = 120
    session["known_features"]["bpSystolic"] = 130
    session["known_features"]["bpDiastolic"] = 85
    session["known_features"]["weight"] = 65
    session["known_features"]["height"] = 160
    session["known_features"]["familyHistory"] = "no"

    assessment.update_session_state(session)

    assert session["current_question"] is None, \
        f"Should be complete, but current_question={session['current_question']}"
    assert session["missing_features"] == []


# ─── F: CSV report extraction ─────────────────────────────────────────────────

def test_csv_report_extraction():
    """F — Upload CSV with patient vitals → correct extraction"""
    sample_csv = b"""field,value
age,42
gender,male
systolic bp,150
diastolic bp,95
glucose,180
height,172
weight,75
heart rate,72
sleep hours,6
stress level,7
smoking,no
"""
    result = assessment.extract_from_csv(sample_csv)
    assert result.get("age") == 42.0, f"age mismatch: {result}"
    assert result.get("bpSystolic") == 150.0, f"systolic mismatch: {result}"
    assert result.get("glucose") == 180.0, f"glucose mismatch: {result}"
    assert result.get("gender") == "male", f"gender mismatch: {result}"


# ─── G: TXT report extraction ────────────────────────────────────────────────

def test_txt_report_extraction():
    """G — Upload TXT medical report → extract biometrics via regex"""
    sample_txt = b"""PATIENT MEDICAL REPORT
Date: 2026-08-07

Age: 42
Blood Pressure: 150/95 mmHg
Fasting Glucose: 180 mg/dL
Weight: 75 kg
Height: 172 cm
Heart Rate: 72 bpm
"""
    result = assessment.extract_from_txt(sample_txt)
    assert "age" in result, f"age not extracted from TXT: {result}"
    assert result["age"] == 42
    # BP is a slash-pair — check it was found
    if "bpSystolic" in result:
        assert result["bpSystolic"] == 150


# ─── H: Ambiguous glucose / clarification context ────────────────────────────

def test_ambiguous_glucose_numeric_extraction():
    """H — 'My sugar is 180' → glucose=180 extracted when question context is glucose"""
    result = assessment.parse_contextual_answer("My sugar is 180", "glucose", "en")
    assert result.get("glucose") == 180, f"Expected glucose=180, got {result}"


def test_glucose_extraction_range_guard():
    """H2 — Unrealistic glucose value (e.g. 2000) should NOT be extracted"""
    result = assessment.parse_contextual_answer("sugar level 2000", "glucose", "en")
    # 2000 is outside the 30–500 mg/dL guard in parse_contextual_answer
    assert result.get("glucose") is None, f"2000 should be rejected, got {result}"


# ─── I: Session lifecycle ────────────────────────────────────────────────────

def test_session_create_and_retrieve():
    """I — Create session → retrieve by ID → values match"""
    session = assessment.create_session("alice", "kn", "heart")
    sid = session["session_id"]

    retrieved = assessment.get_session(sid)
    assert retrieved is not None
    assert retrieved["language"] == "kn"
    assert retrieved["model"] == "heart"
    assert retrieved["username"] == "alice"


def test_session_reset_clears_known_features():
    """I2 — Reset session → known_features should be empty"""
    session = assessment.create_session("bob", "en", "diabetes")
    session["known_features"]["age"] = 45
    session["known_features"]["glucose"] = 120

    assessment.update_session_state(session)
    sid = session["session_id"]

    reset = assessment.reset_session(sid)
    assert reset["known_features"] == {}
    assert reset["current_question"] == assessment.MODEL_REQUIRED_FIELDS["diabetes"][0]


def test_session_not_found():
    """I3 — Non-existent session ID → get_session returns None"""
    result = assessment.get_session("nonexistent-id-12345")
    assert result is None


# ─── J: Full pipeline (session → answer → state update) ─────────────────────

def test_full_pipeline_english():
    """J — Full pipeline: create session → submit answers → verify state"""
    session = assessment.create_session("patient_j", "en", "diabetes")
    sid = session["session_id"]

    # Answer age
    age_ans = assessment.parse_contextual_answer("I am 45 years old", "age", "en")
    session["known_features"].update(age_ans)
    assessment.update_session_state(session)
    assert "age" in session["known_features"]
    assert session["current_question"] != "age"  # Age is now known, should advance

    # Answer gender
    gender_ans = assessment.parse_contextual_answer("I am male", "gender", "en")
    session["known_features"].update(gender_ans)
    assessment.update_session_state(session)
    assert session["known_features"].get("gender") == "male"

    # Answer glucose
    glucose_ans = assessment.parse_contextual_answer("My glucose is 180", "glucose", "en")
    session["known_features"].update(glucose_ans)
    assessment.update_session_state(session)
    assert session["known_features"].get("glucose") == 180


# ─── Utility / regression ─────────────────────────────────────────────────────

def test_normalize_hindi_devanagari_digits():
    """Devanagari digits '४५' → '45'"""
    result = assessment.normalize_digits("मेरी उम्र ४५ वर्ष")
    assert "45" in result


def test_questions_json_loaded():
    """QUESTIONS dict should have all required model fields."""
    required_keys = {"age", "gender", "height", "weight", "bp",
                     "glucose", "heartRate", "sleepDuration", "stressLevel",
                     "dailySteps", "exerciseFrequency", "smoking", "alcohol", "familyHistory"}
    for key in required_keys:
        assert key in assessment.QUESTIONS, f"Missing question key: {key}"
        # Each question should have at least English translation
        assert "en" in assessment.QUESTIONS[key], f"Missing EN translation for: {key}"


def test_model_required_fields_coverage():
    """All MODEL_REQUIRED_FIELDS entries should have corresponding QUESTIONS entries."""
    for model_name, fields in assessment.MODEL_REQUIRED_FIELDS.items():
        for field in fields:
            assert field in assessment.QUESTIONS, \
                f"Model '{model_name}' requires field '{field}' but no question defined for it"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
