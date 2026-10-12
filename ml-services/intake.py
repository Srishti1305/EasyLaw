import re
import spacy
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

nlp = spacy.load("en_core_web_lg")

# Matches: Rs. 5,00,000 | ₹50000 | Rs 1,00,00,000 | INR 25,000
MONEY_PATTERN = re.compile(
    r'(?:Rs\.?|₹|INR)\s?[\d,]+(?:\.\d+)?', re.IGNORECASE
)

class IntakeRequest(BaseModel):
    text: str

@router.post("/intake/extract")
def extract_entities(request: IntakeRequest):
    doc = nlp(request.text)

    entities = {
        "people": [],
        "organizations": [],
        "dates": [],
        "locations": [],
        "money": [],
        "misc": []
    }

    for ent in doc.ents:
        if ent.label_ == "PERSON":
            entities["people"].append(ent.text)
        elif ent.label_ == "ORG":
            entities["organizations"].append(ent.text)
        elif ent.label_ == "DATE":
            entities["dates"].append(ent.text)
        elif ent.label_ in ("GPE", "LOC"):
            entities["locations"].append(ent.text)
        elif ent.label_ == "MONEY":
            entities["money"].append(ent.text)
        elif ent.label_ == "CARDINAL":
            # Skip — often false positives, handled by regex below instead
            continue
        else:
            entities["misc"].append({"text": ent.text, "label": ent.label_})

    # Regex pass for Indian currency formats spaCy misses
    money_matches = MONEY_PATTERN.findall(request.text)
    for m in money_matches:
        if m not in entities["money"]:
            entities["money"].append(m)

    return {
        "original_text": request.text,
        "entities": entities
    }