from langchain.prompts import ChatPromptTemplate
# from langchain.chains import LLMChain
from langchain_groq import ChatGroq

import os
from dotenv import load_dotenv
from pathlib import Path

# Absolute path to .env in backend/
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

load_dotenv()

def generate_questions_from_content(content, config) -> str:
    prompt_path = "prompts/questionPaper.txt"
    with open(prompt_path, "r") as file:
        prompt_template = file.read()
    
    # print(content)

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

    print("Prompt Ready")
    # print(os.getenv("GROQ_API_KEY"))
    llm = ChatGroq(api_key=os.getenv("GROQ_API_KEY"),
        model_name = "gemma2-9b-it",
        temperature=0.2
    )

    response = llm.invoke(chain_input)
    print("LLM Response Ready")
    return response.content
