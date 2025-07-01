from fastapi import File, Form, UploadFile, APIRouter, FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from .models import QuestionConfig
from .services.pdf_extractor import extract_text_from_pdf, get_chunks_from_text, create_vector_store_from_chunks
from .services.quiz_generator import generate_questions_from_content

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generate-question-paper/")
async def generate_question_paper(
    Standard: str = Form(...),
    Subject_Name: str = Form(...),
    # chapter_content: str = Form(...),
    difficulty: str = Form(...),
    countOfMCQs: int = Form(...),
    countOfShort: int = Form(...),
    countOfLong: int = Form(...),
    User_defined_notes: str = Form(None),
    pdf: UploadFile = File(None),
):
    
    if pdf:
        texts = extract_text_from_pdf(pdf.file)
        chunks = get_chunks_from_text(texts)
        vector_store = create_vector_store_from_chunks(chunks)

        chunks = vector_store.similarity_search("", k=10)
        content = "\n\n".join([doc.page_content for doc in chunks])[:12000]
    else:
        content = []

    # Build a config dict manually
    config = {
        "Standard": Standard,
        "Subject_Name": Subject_Name,
        # "chapter_content": chapter_content,
        "difficulty": difficulty,
        "countOfMCQs": countOfMCQs,
        "countOfShort": countOfShort,
        "countOfLong": countOfLong,
        "User_defined_notes": User_defined_notes,
    }

    # Call your logic
    output = generate_questions_from_content(content, config)
    return JSONResponse(content={"question_paper": output})

