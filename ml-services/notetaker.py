import whisper
from transformers import pipeline
from fastapi import APIRouter, UploadFile, File
import tempfile
import os

router = APIRouter()

# Load models once at startup (not per-request — slow otherwise)
print("Loading Whisper model...")
whisper_model = whisper.load_model("base")

print("Loading fine-tuned meeting classifier...")
classifier = pipeline("text-classification", model="./legal-meeting-classifier", tokenizer="./legal-meeting-classifier")

@router.post("/notetaker/transcribe")
async def transcribe_meeting(file: UploadFile = File(...)):
    # Save uploaded audio to a temp file (Whisper needs a file path)
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Step 1: Transcribe audio to text
        result = whisper_model.transcribe(tmp_path)
        full_transcript = result["text"]

        # Step 2: Split into sentences and classify each
        sentences = [s.strip() for s in full_transcript.split('.') if s.strip()]

        classified = {
            "action item": [],
            "general discussion": [],
            "decision made": [],
            "important date or deadline": []
        }

        for sentence in sentences:
          if len(sentence) < 5:
            continue
          output = classifier(sentence)[0]
          top_label = output["label"].replace("_", " ")
          if top_label in classified:
            classified[top_label].append(sentence)

        # Step 3: Build a simple summary (discussion points) + action items
        summary = " ".join(classified["general discussion"][:5]) or "No general discussion detected."
        action_items = classified["action item"] + classified["decision made"]

        return {
            "transcript": full_transcript,
            "summary": summary,
            "action_items": action_items,
            "important_dates": classified["important date or deadline"],
            "classified_breakdown": classified
        }

    finally:
        os.remove(tmp_path)