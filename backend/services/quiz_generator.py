from langchain.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

import os
from dotenv import load_dotenv
from pathlib import Path


backend_root = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=backend_root / ".env")
load_dotenv()

def generate_questions_from_content(content, config) -> str:
    prompt_path = backend_root / "prompts" / "questionPaper.txt"
    if not prompt_path.exists():
        raise FileNotFoundError(f"Prompt file not found: {prompt_path}")

    prompt_template = prompt_path.read_text(encoding="utf-8")

    prompt = ChatPromptTemplate.from_template(prompt_template)
    chain_input = prompt.format(
        Standard=config['Standard'],
        content=content,
        difficulty=config['difficulty'],
        countOfMCQs=config['countOfMCQs'],
        countOfShort=config['countOfShort'],
        countOfLong=config['countOfLong'],
        User_defined_notes=config['User_defined_notes'] or "None",
        Subject_Name=config['Subject_Name']
    )

    llm = ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model="llama-3.1-8b-instant",
        temperature=0.2
    )

    response = llm.invoke(chain_input)
    return response.content
