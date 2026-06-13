import json
import os

import ollama
from dotenv import load_dotenv


load_dotenv()
MODEL = os.getenv("OLLAMA_MODEL", "mistral")

EXTRACTION_SYSTEM_PROMPT = """
You are a memory logging assistant. The user will describe something they experienced, thought about, learned, or did. Extract the following and return ONLY a valid JSON object, no markdown, no explanation:

{
  "summary": "one clear sentence that captures the essence of what the user described, written as a memory log. Start with a verb. Example: Realized that consistent sleep schedules significantly improve focus."
}
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
