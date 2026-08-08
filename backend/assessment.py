"""
VitalPredict Assessment Module
Handles in-memory sessions, text report parsing (PDF, CSV, TXT),
multilingual parameter extraction (English, Hindi, Kannada), local Whisper STT,
and offline SAPI5 TTS generation.
"""

import os
import re
import csv
import io
import json
import logging
import uuid
import tempfile
import base64
import numpy as np

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Load multilingual question bank from questions.json (falls back to built-in)
# ---------------------------------------------------------------------------
_QUESTIONS_JSON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "questions.json")

def _load_questions_from_json() -> dict:
    """Load the question bank from questions.json; fall back to built-in dict on failure."""
    try:
        with open(_QUESTIONS_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        questions_raw = data.get("questions", {})
        # Flatten: {"age": {"en": "...", "hi": "...", "kn": "..."}, ...}
        logger.info(f"Loaded {len(questions_raw)} questions from questions.json")
        return questions_raw
    except FileNotFoundError:
        logger.warning("questions.json not found — using built-in question dict.")
        return {}
    except Exception as e:
        logger.error(f"Failed to load questions.json: {e}. Using built-in question dict.")
        return {}


# Questions and translations database
QUESTIONS = {
    "age": {
        "en": "What is your age in years?",
        "hi": "आपकी आयु कितने वर्ष है?",
        "kn": "ನಿಮ್ಮ ವಯಸ್ಸು ಎಷ್ಟು ವರ್ಷ?"
    },
    "gender": {
        "en": "What is your biological gender? Please say male or female.",
        "hi": "आपका जैविक लिंग क्या है? कृपया पुरुष या महिला कहें।",
        "kn": "ನಿಮ್ಮ ಜೈವಿಕ ಲಿಂಗ ಯಾವುದು? ದಯವಿಟ್ಟು ಪುರುಷ ಅಥವಾ ಮಹಿಳೆ ಎಂದು ಹೇಳಿ."
    },
    "height": {
        "en": "What is your height in centimeters?",
        "hi": "आपकी ऊंचाई सेंटीमीटर में कितनी है?",
        "kn": "ನಿಮ್ಮ ಎತ್ತರ ಎಷ್ಟು ಸೆಂಟಿಮೀಟರ್?"
    },
    "weight": {
        "en": "What is your weight in kilograms?",
        "hi": "आपका वजन किलोग्राम में कितना है?",
        "kn": "ನಿಮ್ಮ ತೂಕ ಎಷ್ಟು ಕಿಲೋಗ್ರಾಂ?"
    },
    "bp": {
        "en": "What is your blood pressure? For example, 120 over 80.",
        "hi": "आपका रक्तचाप कितना है? उदाहरण के लिए, 120 और 80।",
        "kn": "ನಿಮ್ಮ ರಕ್ತದೊತ್ತಡ ಎಷ್ಟು? ಉದಾಹರಣೆಗೆ, 120 ಮತ್ತು 80."
    },
    "glucose": {
        "en": "What is your blood glucose level in milligrams per deciliter?",
        "hi": "आपका ब्लड ग्लूकोज लेवल कितना है (mg/dL में)?",
        "kn": "ನಿಮ್ಮ ರಕ್ತದ ಗ್ಲುಕೋಸ್ ಮಟ್ಟ ಎಷ್ಟು (mg/dL ನಲ್ಲಿ)?"
    },
    "heartRate": {
        "en": "What is your resting heart rate in beats per minute?",
        "hi": "आपकी दिल की धड़कन (BPM) कितनी है?",
        "kn": "ನಿಮ್ಮ ಹೃದಯ ಬಡಿತ ಎಷ್ಟು (BPM)?"
    },
    "sleepDuration": {
        "en": "How many hours of sleep do you get per night?",
        "hi": "आप हर रात कितने घंटे सोते हैं?",
        "kn": "ನೀವು ಪ್ರತಿ ರಾತ್ರಿ ಎಷ್ಟು ಗಂಟೆಗಳ ಕಾಲ ನಿದ್ರಿಸುತ್ತೀರಿ?"
    },
    "stressLevel": {
        "en": "On a scale of 1 to 10, how would you rate your stress level?",
        "hi": "1 से 10 के पैमाने पर, आप अपने तनाव के स्तर को क्या रेटिंग देंगे?",
        "kn": "1 ರಿಂದ 10 ರ ಪ್ರಮಾಣದಲ್ಲಿ, ನಿಮ್ಮ ಒತ್ತಡದ ಮಟ್ಟ ಎಷ್ಟು?"
    },
    "dailySteps": {
        "en": "Approximately how many steps do you walk daily?",
        "hi": "आप रोज़ाना लगभग कितने कदम चलते हैं?",
        "kn": "ನೀವು ದಿನಕ್ಕೆ ಅಂದಾಜು ಎಷ್ಟು ಹೆಜ್ಜೆ ನಡೆಯುತ್ತೀರಿ?"
    },
    "exerciseFrequency": {
        "en": "How many days a week do you exercise?",
        "hi": "आप हफ्ते में कितने दिन व्यायाम करते हैं?",
        "kn": "ನೀವು ವಾರದಲ್ಲಿ ಎಷ್ಟು ದಿನ ವ್ಯಾಯಾಮ ಮಾಡುತ್ತೀರಿ?"
    },
    "smoking": {
        "en": "Are you a smoker? Please say yes or no.",
        "hi": "क्या आप धूम्रपान करते हैं? कृपया हाँ या नहीं कहें।",
        "kn": "ನೀವು ಧೂಮಪಾನ ಮಾಡುತ್ತೀರಾ? ದಯವಿಟ್ಟು ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಹೇಳಿ."
    },
    "alcohol": {
        "en": "How would you describe your alcohol consumption? Please say none, moderate, or high.",
        "hi": "आप अपने शराब के सेवन का वर्णन कैसे करेंगे? कृपया बिल्कुल नहीं, मध्यम, या अधिक कहें।",
        "kn": "ನಿಮ್ಮ ಮದ್ಯಪಾನದ ಬಳಕೆಯನ್ನು ಹೇಗೆ ವಿವರಿಸುತ್ತೀರಿ? ದಯವಿಟ್ಟು ಯಾವುದೂ ಇಲ್ಲ, ಸಾಧಾರಣ, ಅಥವಾ ಹೆಚ್ಚು ಎಂದು ಹೇಳಿ."
    },
    "familyHistory": {
        "en": "Do you have a family history of heart disease or diabetes? Please say yes or no.",
        "hi": "क्या आपके परिवार में हृदय रोग या मधुमेह का इतिहास है? कृपया हाँ या नहीं कहें।",
        "kn": "ನಿಮ್ಮ ಕುಟುಂಬದಲ್ಲಿ ಹೃದಯ ಕಾಯಿಲೆ ಅಥವಾ ಮಧುಮೇಹದ ಇತಿಹಾಸವಿದೆಯೇ? ದಯವಿಟ್ಟು ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಹೇಳಿ."
    }
}

# Merge questions.json into QUESTIONS (JSON wins on overlap, giving richer language coverage)
_json_questions = _load_questions_from_json()
for _field, _translations in _json_questions.items():
    if _field in QUESTIONS:
        QUESTIONS[_field].update(_translations)
    else:
        QUESTIONS[_field] = _translations

# Base fields mapped to disease model dependency vectors
MODEL_REQUIRED_FIELDS = {
    "heart": ["age", "gender", "height", "weight", "bp", "glucose", "heartRate", "exerciseFrequency", "smoking", "familyHistory", "stressLevel"],
    "diabetes": ["age", "gender", "glucose", "bp", "weight", "height", "familyHistory"],
    "sleep": ["age", "gender", "sleepDuration", "stressLevel", "heartRate", "dailySteps", "bp", "exerciseFrequency", "weight", "height"],
    "full": ["age", "gender", "height", "weight", "bp", "glucose", "heartRate", "sleepDuration", "stressLevel", "dailySteps", "exerciseFrequency", "smoking", "alcohol", "familyHistory"]
}

# Indian/Devanagari digit normalizer mappings
DIGIT_NORMALIZER = {
    '೦': '0', '೧': '1', '೨': '2', '೩': '3', '೪': '4', '೫': '5', '೬': '6', '೭': '7', '೮': '8', '೯': '9',
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
}

# Local in-memory session cache
_sessions = {}

# Lazy loaded whisper speech model
_whisper_model = None

def get_whisper_model():
    """Load OpenAI Whisper tiny model once and cache it."""
    global _whisper_model
    if _whisper_model is None:
        try:
            import whisper
            logger.info("Initializing offline Whisper tiny STT model...")
            models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models', 'whisper')
            os.makedirs(models_dir, exist_ok=True)
            # Load tiny model for low latency CPU execution
            _whisper_model = whisper.load_model("tiny", download_root=models_dir)
            logger.info("Whisper model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load Whisper STT model locally: {e}")
            _whisper_model = None
    return _whisper_model


def normalize_digits(text: str) -> str:
    """Normalize Kannada and Devanagari numerals to standard Western numerals."""
    if not text:
        return ""
    normalized = list(text)
    for i, char in enumerate(normalized):
        if char in DIGIT_NORMALIZER:
            normalized[i] = DIGIT_NORMALIZER[char]
    return "".join(normalized)


def create_session(username: str, language: str = "en", model: str = "full") -> dict:
    """Create a new assessment session."""
    session_id = str(uuid.uuid4())
    required_fields = MODEL_REQUIRED_FIELDS.get(model, MODEL_REQUIRED_FIELDS["full"])
    
    # Initialize session state
    session = {
        "session_id": session_id,
        "username": username,
        "language": language,
        "model": model,
        "known_features": {},
        "missing_features": list(required_fields),
        "current_question": required_fields[0],
        "conversation_history": []
    }
    _sessions[session_id] = session
    return session


def get_session(session_id: str) -> dict:
    """Retrieve an active session state."""
    return _sessions.get(session_id)


def reset_session(session_id: str) -> dict:
    """Reset the known parameters in a session."""
    session = _sessions.get(session_id)
    if not session:
        return None
    required_fields = MODEL_REQUIRED_FIELDS.get(session["model"], MODEL_REQUIRED_FIELDS["full"])
    session["known_features"] = {}
    session["missing_features"] = list(required_fields)
    session["current_question"] = required_fields[0]
    session["conversation_history"] = []
    return session



# Maps model field names → their internal data dict key (camelCase)
# Add new field aliases here when adding new model features.
FIELD_ALIASES = {
    "bp": None,                          # Special: needs bpSystolic + bpDiastolic
    "age": "age",
    "gender": "gender",
    "height": "height",
    "weight": "weight",
    "glucose": "glucose",
    "heartRate": "heartRate",
    "sleepDuration": "sleepDuration",
    "stressLevel": "stressLevel",
    "dailySteps": "dailySteps",
    "exerciseFrequency": "exerciseFrequency",
    "smoking": "smoking",
    "alcohol": "alcohol",
    "familyHistory": "familyHistory",
}


def update_session_state(session: dict):
    """Re-compute missing fields and update current_question based on what is known."""
    required = MODEL_REQUIRED_FIELDS.get(session["model"], MODEL_REQUIRED_FIELDS["full"])
    known = session["known_features"]

    missing = []
    for field in required:
        if field == "bp":
            # BP counts as known only if BOTH systolic and diastolic are captured
            if "bpSystolic" not in known or "bpDiastolic" not in known:
                missing.append("bp")
        else:
            # Resolve alias (default: field name is its own key)
            fe_key = FIELD_ALIASES.get(field, field)
            # Use `in` check so that 0 / 0.0 / False are treated as known values
            if fe_key not in known:
                missing.append(field)

    session["missing_features"] = missing
    session["current_question"] = missing[0] if missing else None


# --- MULTILINGUAL NATURAL LANGUAGE EXTRACTOR ---

def extract_numbers(text: str) -> list:
    """Helper to extract clean integers/floats from string."""
    return [float(x) if '.' in x else int(x) for x in re.findall(r'\d+(?:\.\d+)?', text)]


def parse_contextual_answer(text: str, question_field: str, lang: str) -> dict:
    """Extract answers based on the specific question that was asked."""
    text_norm = normalize_digits(text.lower())
    numbers = extract_numbers(text_norm)
    
    result = {}
    
    if question_field == "age" and numbers:
        age = next((n for n in numbers if 1 <= n <= 110), None)
        if age:
            result["age"] = age
            
    elif question_field == "gender":
        male_words = ["male", "man", "boy", "ಪುರುಷ", "ಗಂಡು", "पुरुष", "लड़का", "मैल"]
        female_words = ["female", "woman", "girl", "ಮಹಿಳೆ", "ಹೆಣ್ಣು", "महिला", "लड़की", "फीमेल"]
        if any(w in text_norm for w in male_words):
            result["gender"] = "male"
        elif any(w in text_norm for w in female_words):
            result["gender"] = "female"
            
    elif question_field == "height" and numbers:
        height = next((n for n in numbers if 80 <= n <= 250), None)
        if height:
            result["height"] = height
            
    elif question_field == "weight" and numbers:
        weight = next((n for n in numbers if 20 <= n <= 250), None)
        if weight:
            result["weight"] = weight
            
    elif question_field == "bp":
        bp_match = re.findall(r'(\d{2,3})\s*(?:/|over|by|ಮತ್ತು|ಮತ್ತು|और|बटा|\s+)\s*(\d{2,3})', text_norm)
        if bp_match:
            systolic, diastolic = int(bp_match[0][0]), int(bp_match[0][1])
            if 50 <= systolic <= 250 and 30 <= diastolic <= 150:
                result["bpSystolic"] = systolic
                result["bpDiastolic"] = diastolic
        elif len(numbers) >= 2:
            systolic = next((n for n in numbers if 80 <= n <= 220), None)
            diastolic = next((n for n in numbers if 40 <= n <= 130), None)
            if systolic and diastolic:
                result["bpSystolic"] = systolic
                result["bpDiastolic"] = diastolic
                
    elif question_field == "glucose" and numbers:
        glucose = next((n for n in numbers if 30 <= n <= 500), None)
        if glucose:
            result["glucose"] = glucose
            
    elif question_field == "heartRate" and numbers:
        hr = next((n for n in numbers if 40 <= n <= 220), None)
        if hr:
            result["heartRate"] = hr
            
    elif question_field == "sleepDuration" and numbers:
        sleep = next((n for n in numbers if 1 <= n <= 20), None)
        if sleep:
            result["sleepDuration"] = sleep
            
    elif question_field == "stressLevel" and numbers:
        stress = next((n for n in numbers if 1 <= n <= 10), None)
        if stress:
            result["stressLevel"] = stress
            
    elif question_field == "dailySteps" and numbers:
        steps = next((n for n in numbers if n >= 500), None)
        if steps:
            result["dailySteps"] = steps
            
    elif question_field == "exerciseFrequency" and numbers:
        freq = next((n for n in numbers if 0 <= n <= 7), None)
        if freq is not None:
            result["exerciseFrequency"] = freq
            
    elif question_field == "smoking":
        yes_words = ["yes", "smoker", "smoke", "ಹೌದು", "ಧೂಮಪಾನ", "हाँ", "धूम्रपान करता हूँ"]
        no_words = ["no", "don't", "non", "ಇಲ್ಲ", "ಧೂಮಪಾನ ಮಾಡಲ್ಲ", "नहीं", "धूम्रपान नहीं"]
        if any(w in text_norm for w in yes_words):
            result["smoking"] = "smoker"
        elif any(w in text_norm for w in no_words):
            result["smoking"] = "non-smoker"
            
    elif question_field == "alcohol":
        high_words = ["high", "a lot", "heavy", "ಹೆಚ್ಚು", "ಅತಿಯಾಗಿ", "अधिक", "बहुत", "ज्यादा"]
        mod_words = ["moderate", "social", "some", "ಸಾಧಾರಣ", "ಮಧ್ಯಮ", "कभी-कभार", "थोड़ा"]
        none_words = ["no", "never", "none", "ಇಲ್ಲ", "ಕುಡಿಯುವುದಿಲ್ಲ", "नहीं", "बिल्कुल नहीं", "नही"]
        if any(w in text_norm for w in high_words):
            result["alcohol"] = "high"
        elif any(w in text_norm for w in mod_words):
            result["alcohol"] = "moderate"
        elif any(w in text_norm for w in none_words):
            result["alcohol"] = "none"
            
    elif question_field == "familyHistory":
        yes_words = ["yes", "have", "history", "ಹೌದು", "ಇದೆ", "हाँ", "इतिहास है"]
        no_words = ["no", "none", "don't", "ಇಲ್ಲ", "ಯಾವುದೂ ಇಲ್ಲ", "नहीं", "नही"]
        if any(w in text_norm for w in yes_words):
            result["familyHistory"] = "yes"
        elif any(w in text_norm for w in no_words):
            result["familyHistory"] = "no"
            
    return result


def extract_global_parameters(text: str) -> dict:
    """Parse text globally using clinical keyword patterns."""
    text_norm = normalize_digits(text.lower())
    result = {}
    
    # Age
    age_match = re.search(r'\b(?:age|years|ವಯಸ್ಸು|ವರ್ಷ|उम्र|साल|वर्ष)\b\s*[:=is\s]*\s*(\d{1,2})', text_norm)
    if age_match:
        result["age"] = int(age_match.group(1))
    
    # Blood Pressure
    bp_match = re.search(r'\b(?:bp|blood pressure|ರಕ್ತದೊತ್ತಡ|रक्तचाप)\b\s*[:=is\s]*\s*(\d{2,3})\s*(?:/|over|by|ಮತ್ತು|और|बटा)\s*(\d{2,3})', text_norm)
    if bp_match:
        result["bpSystolic"] = int(bp_match.group(1))
        result["bpDiastolic"] = int(bp_match.group(2))
    else:
        bp_raw = re.search(r'\b(\d{2,3})\s*/\s*(\d{2,3})\b', text_norm)
        if bp_raw:
            result["bpSystolic"] = int(bp_raw.group(1))
            result["bpDiastolic"] = int(bp_raw.group(2))
            
    # Glucose
    glucose_match = re.search(r'\b(?:glucose|sugar|blood sugar|ಶರ್ಕರ|ಸಕ್ಕರೆ|ಗ್ಲುಕೋಸ್|शुगर|ग्लूकोज)\b\s*[:=is\s]*\s*(\d{2,3})', text_norm)
    if glucose_match:
        result["glucose"] = int(glucose_match.group(1))
        
    # Weight
    weight_match = re.search(r'\b(?:weight|kg|ತೂಕ|ಕೆಜಿ|वजन|भार|किलो)\b\s*[:=is\s]*\s*(\d{2,3})', text_norm)
    if weight_match:
        result["weight"] = float(weight_match.group(1))
        
    # Height
    height_match = re.search(r'\b(?:height|cm|ಎತ್ತರ|ಸೆಂ.ಮೀ|ऊंचाई|लंबाई)\b\s*[:=is\s]*\s*(\d{2,3})', text_norm)
    if height_match:
        result["height"] = float(height_match.group(1))
        
    # Heart Rate
    hr_match = re.search(r'\b(?:heart rate|pulse|bpm|ಹೃದಯ ಬಡಿತ|ನಾಡಿಮಿಡಿತ|दिल की धड़कन|पल्स)\b\s*[:=is\s]*\s*(\d{2,3})', text_norm)
    if hr_match:
        result["heartRate"] = int(hr_match.group(1))
        
    # Sleep
    sleep_match = re.search(r'\b(?:sleep|hours|ನಿದ್ರೆ|ಗಂಟೆಗಳು|नींद|घंटे)\b\s*[:=is\s]*\s*(\d{1,2}(?:\.\d)?)', text_norm)
    if sleep_match:
        result["sleepDuration"] = float(sleep_match.group(1))
        
    # Gender
    if "gender" not in result:
        if any(w in text_norm for w in ["female", "woman", "ಹೆಣ್ಣು", "ಮಹಿಳೆ", "महिला"]):
            result["gender"] = "female"
        elif any(w in text_norm for w in ["male", "man", "ಗಂಡು", "ಪುರುಷ", "पुरुष"]):
            result["gender"] = "male"
            
    return result


# --- REPORT FILE PARSERS (OFFLINE) ---

def extract_from_txt(content: bytes) -> dict:
    """Extract biometrics from standard TXT medical report."""
    text = content.decode('utf-8', errors='ignore')
    return extract_global_parameters(text)


def extract_from_csv(content: bytes) -> dict:
    """Extract biometrics from clinical CSV datasets or patient record rows."""
    try:
        text = content.decode('utf-8', errors='ignore')
        reader = csv.reader(io.StringIO(text))
        data = {}
        for row in reader:
            if not row or len(row) < 2:
                continue
            key = row[0].strip().lower()
            val = row[1].strip()
            if "age" in key:
                data["age"] = float(val)
            elif "gender" in key or "sex" in key:
                data["gender"] = "male" if val.lower() in ["male", "1", "m"] else "female"
            elif "systolic" in key:
                data["bpSystolic"] = float(val)
            elif "diastolic" in key:
                data["bpDiastolic"] = float(val)
            elif "glucose" in key or "sugar" in key:
                data["glucose"] = float(val)
            elif "height" in key:
                data["height"] = float(val)
            elif "weight" in key:
                data["weight"] = float(val)
            elif "heart" in key or "bpm" in key:
                data["heartRate"] = float(val)
            elif "sleep" in key:
                data["sleepDuration"] = float(val)
            elif "stress" in key:
                data["stressLevel"] = float(val)
            elif "smoke" in key or "smoking" in key:
                data["smoking"] = "smoker" if val.lower() in ["yes", "1", "true", "smoker"] else "non-smoker"
            elif "alcohol" in key:
                data["alcohol"] = val.lower() if val.lower() in ["none", "moderate", "high"] else "none"
            elif "history" in key:
                data["familyHistory"] = "yes" if val.lower() in ["yes", "1", "true"] else "no"
        return data
    except Exception as e:
        logger.error(f"CSV report parsing failed: {e}")
        return {}


def extract_from_pdf(content: bytes) -> dict:
    """Extract text from clinical PDF file using pypdf locally."""
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(content))
        text = ""
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
        return extract_global_parameters(text)
    except ImportError:
        logger.warning("pypdf library not found. Please run VOICE_SETUP.md checklist.")
        return {}
    except Exception as e:
        logger.error(f"PDF report parsing failed: {e}")
        return {}


def extract_from_image(content: bytes) -> dict:
    """Extract text from PNG/JPG reports using local Tesseract OCR if available."""
    try:
        import pytesseract
        from PIL import Image
        image = Image.open(io.BytesIO(content))
        text = pytesseract.image_to_string(image)
        return extract_global_parameters(text)
    except ImportError:
        logger.warning("pytesseract library or PIL not found. Skipping OCR.")
        return {}
    except Exception as e:
        logger.error(f"Image OCR report parsing failed: {e}")
        return {}


# --- LOCAL TEXT-TO-SPEECH (OFFLINE) ---

def text_to_speech(text: str, lang: str) -> str:
    """
    Generate speech file from text locally using pyttsx3.
    Saves to a temporary wav and returns a base64 encoded audio string.
    """
    try:
        import pyttsx3
        engine = pyttsx3.init()
        engine.setProperty('rate', 150)
        
        voices = engine.getProperty('voices')
        for voice in voices:
            v_name = voice.name.lower()
            if lang == "hi" and ("hindi" in v_name or "india" in v_name):
                engine.setProperty('voice', voice.id)
                break
            elif lang == "kn" and ("kannada" in v_name or "india" in v_name):
                engine.setProperty('voice', voice.id)
                break
                
        fd, temp_path = tempfile.mkstemp(suffix=".wav")
        os.close(fd)
        
        engine.save_to_file(text, temp_path)
        engine.runAndWait()
        
        with open(temp_path, "rb") as f:
            audio_bytes = f.read()
            
        os.unlink(temp_path)
        
        b64_audio = base64.b64encode(audio_bytes).decode('utf-8')
        return b64_audio
    except Exception as e:
        logger.error(f"Local pyttsx3 TTS synthesis failed: {e}. Falling back to client-side voice.")
        return ""
