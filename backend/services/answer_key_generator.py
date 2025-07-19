from langchain.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
import os

def generate_answer_key_from_question_paper(question_paper: str) -> str:
    prompt_path = "prompts/answerKey.txt"
    with open(prompt_path, "r") as file:
        prompt_template = file.read()

    prompt = ChatPromptTemplate.from_template(prompt_template)
    chain_input = prompt.format(question_paper=question_paper)

    llm = ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model_name="gemma2-9b-it",
        temperature=0.2,
    )

    response = llm.invoke(chain_input)
    return response.content
