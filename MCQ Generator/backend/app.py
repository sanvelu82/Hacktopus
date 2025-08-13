from flask import Flask, jsonify, request
from flask_cors import CORS
import google.generativeai as genai
import json
import re

app = Flask(__name__)
CORS(app)  

genai.configure(api_key="AIzaSyB2gJRlvjKllkfXDdG21_V5pMZT_4t_SDM")

def clean_response(response_text):
    """Remove Markdown formatting (triple backticks) and clean JSON."""
    cleaned_text = re.sub(r"```json|```", "", response_text).strip()
    return cleaned_text

def generate_mcqs(topic):
    """
    Uses the Gemini 2.0 Flash 001 model to generate MCQs for the given topic.
    Returns a JSON list of MCQs if successful, or an error dictionary if parsing fails.
    """
    prompt = f"""
You are an expert educator in {topic}. Generate 51 multiple-choice questions (MCQs) strictly on the topic of {topic}. 
For each question, provide:
- A clear question statement.
- Four answer options labeled A, B, C, and D.
- The correct answer letter.
Return the output as a JSON list in this format:
[
    {{"question": "Question text", "options": ["A. Option1", "B. Option2", "C. Option3", "D. Option4"], "answer": "B"}}
]
    """

    model = genai.GenerativeModel("models/gemini-2.0-flash-001")
    response = model.generate_content(prompt)

    try:
        cleaned_text = clean_response(response.text)
        mcqs = json.loads(cleaned_text)
    except Exception as e:
        mcqs = {
            "error": "Failed to parse generated content",
            "response_text": response.text,
            "exception": str(e)
        }
    return mcqs

@app.route("/generate-mcqs", methods=["GET"])
def generate_mcqs_endpoint():
    """
    Endpoint to generate MCQs.
    Expects an optional 'topic' query parameter: /generate-mcqs?topic=Python
    Defaults to "Artificial Intelligence" if none is provided.
    """
    topic = request.args.get("topic", """Generate the hard question baased on C++ language""")
    mcqs = generate_mcqs(topic)
    return jsonify(mcqs)

if __name__ == "__main__":
    app.run(debug=True, port=5001)