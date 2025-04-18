import torch
from transformers import AutoModel, AutoTokenizer
import pdfplumber
import re
from sentence_transformers import SentenceTransformer, util

# Load LLaMA tokenizer and model (Meta's LLaMA or Hugging Face fine-tuned model)
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-3")
model = AutoModel.from_pretrained("meta-llama/Llama-3")

# Load sentence embedding model for similarity checking
embedding_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF resumes."""
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text.strip()

def preprocess_resume(text):
    """Clean and preprocess extracted resume text."""
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)  # Remove special characters
    return text.lower()

def get_resume_embedding(text):
    """Convert resume text into an embedding using sentence-transformers."""
    return embedding_model.encode(text, convert_to_tensor=True)

def match_resume_with_job(resume_text, job_description):
    """Compute similarity score between resume and job description using embeddings."""
    resume_embedding = get_resume_embedding(resume_text)
    job_embedding = get_resume_embedding(job_description)
    similarity_score = util.pytorch_cos_sim(resume_embedding, job_embedding)
    return similarity_score.item()

def analyze_bias(text):
    """Use LLaMA to detect biased language in job descriptions."""
    inputs = tokenizer(text, return_tensors="pt")
    outputs = model(**inputs)
    return outputs

def rewrite_job_description(text):
    """Use LLaMA to generate a bias-free version of a job description."""
    prompt = f"Rewrite the following job description in an inclusive way: {text}"
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(**inputs)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

def generate_hiring_report(candidate_data):
    """Summarize hiring insights using LLaMA."""
    prompt = f"Generate a hiring report based on the following data: {candidate_data}"
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(**inputs)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

# Example Usage
if __name__ == "__main__":
    resume_text = extract_text_from_pdf("example_resume.pdf")
    resume_text = preprocess_resume(resume_text)
    job_description = "Looking for an AI/ML professor with research experience."
    similarity_score = match_resume_with_job(resume_text, job_description)
    print(f"Resume Match Score: {similarity_score:.2f}")
    
    bias_report = analyze_bias(job_description)
    print("Bias Analysis Report:", bias_report)
    
    revised_job_desc = rewrite_job_description(job_description)
    print("Revised Job Description:", revised_job_desc)
    
    hiring_report = generate_hiring_report("Sample candidate dataset")
    print("Hiring Report:", hiring_report)
