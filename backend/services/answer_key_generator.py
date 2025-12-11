from langchain.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
import os
from pathlib import Path
from dotenv import load_dotenv

# Ensure .env in backend/ is loaded
backend_root = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=backend_root / ".env")
load_dotenv()  # fallback to default behavior

def generate_answer_key_from_question_paper(question_paper: str) -> str:
    prompt_path = backend_root / "prompts" / "answerKey.txt"
    if not prompt_path.exists():
        raise FileNotFoundError(f"Prompt file not found: {prompt_path}")

    prompt_template = prompt_path.read_text(encoding="utf-8")

    prompt = ChatPromptTemplate.from_template(prompt_template)
    chain_input = prompt.format(question_paper=question_paper)

    llm = ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model="llama-3.1-8b-instant",
        temperature=0.2,
    )

    response = llm.invoke(chain_input)
    return response.content
