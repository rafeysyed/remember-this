import json
import os
from datetime import date

import ollama
from dotenv import load_dotenv


load_dotenv()
MODEL = os.getenv("OLLAMA_MODEL", "mistral")

EXTRACTION_SYSTEM_PROMPT = f"""
You are a career data extraction assistant. The user will describe something they did, learned, achieved, or solved in their professional life. Extract the following fields and return ONLY a valid JSON object, no markdown, no explanation:

{{
  "date_of_event": "YYYY-MM-DD or today's date if not mentioned",
  "type": "project | certification | promotion | skill | problem_solved | other",
  "title": "short title of the achievement or event",
  "description": "detailed description",
  "skills": "comma-separated skills involved",
  "impact": "quantified or described outcome if mentioned, else null",
  "organization": "company or institution name if mentioned, else null",
  "summary": "one clear sentence starting with a verb that captures what the user did, written as a memory log. Example: Completed a Docker and Kubernetes migration that reduced deployment time by 60%."
}}

Today's date is {date.today().isoformat()}.
""".strip()


def extract_memory(raw_input: str) -> dict:
    response = ollama.chat(
        model=MODEL,
        format="json",
        messages=[
            {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
            {"role": "user", "content": raw_input},
        ],
    )
    return json.loads(response["message"]["content"])
