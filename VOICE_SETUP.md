# VitalPredict — Voice + Medical Report Assessment Setup Guide

> **Target audience:** Developers setting up this module for the first time, or deploying to a local clinic machine.

---

## 1. Why This Architecture?

VitalPredict is an **offline-first** system designed for use in settings with unreliable internet (rural clinics, low-bandwidth environments). All speech recognition, text-to-speech, and ML inference runs **locally on the same machine** with no external API calls.

| Component | Library | Reason chosen |
|-----------|---------|---------------|
| Speech-to-Text | **OpenAI Whisper `tiny`** | Offline multilingual (99 languages including Kannada, Hindi, Tamil, Telugu). Runs on CPU. ~75 MB model. Best accuracy/size trade-off for clinic hardware. |
| Text-to-Speech | **pyttsx3 (SAPI5 on Windows)** | Zero-install on Windows, no model download. Falls back to browser `speechSynthesis` API automatically if unavailable. |
| OCR (image reports) | **Tesseract + pytesseract** | Local OCR, no cloud required. Optional: gracefully skipped if not installed. |
| PDF parsing | **pypdf** | Pure Python, no system dependencies. |

---

## 2. Required Python Packages

```bash
cd backend
pip install -r requirements.txt
```

This installs everything including:
- `openai-whisper>=20231117` — Local Whisper STT
- `pyttsx3>=2.90` — Offline TTS
- `pypdf>=4.2.0` — PDF medical report parsing
- `pytesseract>=0.3.10` — OCR for image-based reports (optional)
- `Pillow` — Image handling for OCR

---

## 3. Whisper STT Model Download

The Whisper `tiny` model (~75 MB) downloads **automatically on first use**.

### Automatic (recommended)
The backend downloads it to `backend/models/whisper/` on first voice request.

### Manual pre-download (for offline clinics)
```bash
cd backend
python -c "import whisper; whisper.load_model('tiny', download_root='models/whisper')"
```

### Directory structure after download
```
backend/
└── models/
    ├── whisper/
    │   └── tiny.pt             ← ~75 MB Whisper model weights
    ├── heart_model.joblib
    ├── diabetes_model.joblib
    └── sleep_model.joblib
```

> **Important:** `backend/models/whisper/` is excluded from Git (see `.gitignore`). Models must be downloaded on each new machine.

---

## 4. Text-to-Speech Setup

### Windows (SAPI5) — Default
pyttsx3 uses the built-in Windows SAPI5 engine. Works automatically.

**For Hindi / Kannada voice output:** Install the corresponding Windows language pack:
1. `Settings → Time & Language → Language`
2. Add **Hindi (India)** and/or **Kannada (India)**
3. Download the **Text-to-Speech** component for each language

> If Hindi/Kannada TTS voices are not installed, the system **automatically falls back** to the browser's `window.speechSynthesis` API, which uses the OS voices available in the browser context.

### Linux / macOS
pyttsx3 uses `espeak` on Linux and `nsss` on macOS.

```bash
# Ubuntu/Debian
sudo apt-get install espeak espeak-data

# macOS — works out of box via System Voice
```

---

## 5. OCR Setup (Optional — for image report uploads)

Image-based medical reports (JPG/PNG scans) require Tesseract OCR.

### Windows
1. Download [Tesseract installer](https://github.com/UB-Mannheim/tesseract/wiki)
2. Install and note the install path (e.g., `C:\Program Files\Tesseract-OCR\tesseract.exe`)
3. Add to PATH or set in your environment:
   ```bash
   set TESSDATA_PREFIX=C:\Program Files\Tesseract-OCR\tessdata
   ```

### Linux
```bash
sudo apt-get install tesseract-ocr
# For Indian languages (optional):
sudo apt-get install tesseract-ocr-hin tesseract-ocr-kan tesseract-ocr-tam
```

> If Tesseract is not installed, image uploads return `{}` (empty extraction) and log a warning. The system continues normally.

---

## 6. Starting the Backend

```bash
cd backend

# Activate virtual environment (if using one)
.venv\Scripts\activate          # Windows
source .venv/bin/activate       # Linux/macOS

# Start FastAPI server
uvicorn main:app --reload --port 8000 --host 0.0.0.0
```

The server starts and:
1. Initialises the SQLite database
2. Loads the ML models (heart, diabetes, sleep)
3. Loads `questions.json` and merges into the QUESTIONS dict
4. Whisper is loaded **lazily** on the first voice request (not at startup, to avoid slow boot)

Swagger API documentation: http://localhost:8000/docs

---

## 7. Starting the Frontend

```bash
# From project root
npm run dev
```

Frontend starts at: http://localhost:5173

The Vite dev server proxies `/api/*` to `http://localhost:8000` automatically.

---

## 8. Testing the Microphone

### In-browser test
1. Open http://localhost:5173
2. Log in and navigate to **AI Health Assessment** in the sidebar
3. Select language (e.g., English)
4. Click **Multilingual Voice Chat** → Start
5. Click the 🎤 microphone button
6. **Allow microphone** in browser permissions popup
7. Say: *"I am 42 years old"*
8. Stop recording — check that `age: 42` appears in **Collected Clinical Information**

### Backend test (curl)
```bash
# 1. Create a session
curl -X POST http://localhost:8000/api/assessment/session \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "language": "en", "model": "diabetes"}'

# Note the session_id from the response, then:

# 2. Send a text answer
curl -X POST http://localhost:8000/api/assessment/{SESSION_ID}/answer \
  -H "Content-Type: application/json" \
  -d '{"text": "I am 42 years old"}'
```

---

## 9. Testing Report Upload

### Prepare a sample report
Create a file `sample_report.txt` with:
```
Patient Report
Age: 42
Blood Pressure: 150/95 mmHg
Fasting Glucose: 180 mg/dL
Weight: 75 kg
Height: 172 cm
Heart Rate: 72 BPM
```

### Upload via UI
1. Log in → AI Health Assessment → **Upload Medical Report**
2. Click **Browse Local File** → select `sample_report.txt`
3. Verify the extracted parameters appear in the verification form

### Upload via curl
```bash
# First create a session
SESSION=$(curl -s -X POST http://localhost:8000/api/assessment/session \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "language": "en", "model": "full"}' | python -c "import sys,json; print(json.load(sys.stdin)['session_id'])")

# Upload report
curl -X POST "http://localhost:8000/api/assessment/${SESSION}/upload-report" \
  -F "file=@sample_report.txt"
```

---

## 10. Testing Multilingual Mode

### Kannada (ಕನ್ನಡ)
1. In AI Health Assessment, select **ಕನ್ನಡ (Kannada)** from the language dropdown
2. Start Voice Chat
3. The greeting will be in Kannada
4. Say: *"ನನಗೆ 45 ವರ್ಷ"* (I am 45 years old)
5. Expected extraction: `age: 45`

### Hindi (हिंदी)
1. Select **हिंदी (Hindi)** from the language dropdown
2. Start Voice Chat
3. Say: *"मेरी उम्र 42 साल है"*
4. Expected extraction: `age: 42`

> **Note:** Whisper automatically detects the spoken language. You can also force it by setting the `language` field in the session. The Whisper `tiny` model supports 99 languages including all major Indian languages.

---

## 11. Running the Test Suite

```bash
cd backend

# Install pytest if needed
pip install pytest

# Run all tests with verbose output
python -m pytest test_assessment.py -v

# Run a specific test
python -m pytest test_assessment.py::test_bp_extraction_over_format -v

# Run with coverage report
pip install pytest-cov
python -m pytest test_assessment.py --cov=assessment --cov-report=term-missing
```

Expected output: **22+ tests passing**.

---

## 12. Offline Verification Checklist

After setup, disconnect from the internet and verify:

- [ ] Backend starts without errors: `uvicorn main:app --reload`
- [ ] Frontend loads at http://localhost:5173
- [ ] Login works (SQLite database)
- [ ] AI Health Assessment page loads
- [ ] Report upload extracts values (TXT/CSV)
- [ ] Voice recording captures microphone input
- [ ] Voice answer is transcribed (Whisper offline)
- [ ] TTS responds with question audio (pyttsx3 or browser)
- [ ] Analyze runs risk prediction (ML models)
- [ ] SHAP chart renders (explainability)
- [ ] Result displayed + spoken

---

## 13. Performance Notes

| Operation | Expected Latency (CPU) |
|-----------|------------------------|
| Whisper tiny transcription | 1–3 seconds per 5s clip |
| PDF text extraction | < 500ms |
| ML model inference (XGBoost) | < 100ms |
| SHAP explanation | 200–800ms |
| pyttsx3 TTS generation | 300–600ms |

Whisper model is **loaded once at first request** and cached in memory. Subsequent requests use the cached model and are 10x faster.

---

## 14. Known Limitations

1. **Whisper `tiny` accuracy**: Smaller model, works well for clear speech and standard medical terms. For production, consider `base` or `small` models (larger but more accurate).
2. **pyttsx3 Indian language TTS**: Requires Windows language packs for Hindi/Kannada voice output. Falls back to browser TTS automatically.
3. **Tesseract OCR**: Accuracy depends on scan/image quality. Handwritten reports may not extract correctly.
4. **Session storage**: Sessions are in-memory. Restarting the server clears all active sessions.
5. **Concurrent users**: Single-process backend. For clinic use, run multiple uvicorn workers: `uvicorn main:app --workers 4`.

---

## 15. What the Student Needs to Provide

The following external items are **NOT tracked in Git** and must be set up on each machine:

| Item | How to obtain | Where to put it |
|------|---------------|-----------------|
| Whisper `tiny` model | Auto-downloaded on first use, or: `python -c "import whisper; whisper.load_model('tiny', download_root='models/whisper')"` | `backend/models/whisper/tiny.pt` |
| Trained ML model files | Run `python train_heart_model.py && python train_diabetes_model.py && python train_sleep_model.py` | `backend/models/` |
| (Optional) Tesseract OCR | Download from https://github.com/UB-Mannheim/tesseract/wiki | System PATH |
| (Optional) Hindi/Kannada TTS voices | Windows Settings → Language → Download TTS | Windows system |

---

*This module was designed to meet the offline-first requirement of the VitalPredict project. All processing occurs locally. No patient data leaves the device.*
