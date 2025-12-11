from fastapi import File, Form, UploadFile, APIRouter, FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from .models import QuestionConfig
from .services.quiz_generator import generate_questions_from_content
from .services.pdf_extractor import extract_text_from_pdf, chunk_text_and_assign_topics, create_vector_store
from .services.answer_key_generator import generate_answer_key_from_question_paper

from langchain_community.embeddings import FastEmbedEmbeddings 

from langchain_community.vectorstores import FAISS

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
    difficulty: str = Form(...),
    countOfMCQs: int = Form(...),
    countOfShort: int = Form(...),
    countOfLong: int = Form(...),
    User_defined_notes: str = Form(None),
    pdf: UploadFile = File(None),
):
    content = ""

    if pdf:
        # 1. Extract raw text from the PDF
        raw_text = extract_text_from_pdf(pdf.file)

        # 2. Use semantic chunking to get chunks and topic-based metadata
        chunks, metadata = chunk_text_and_assign_topics(raw_text)

        if not chunks:
            # Handle case where no text could be processed
            return JSONResponse(status_code=400, content={"error": "Could not extract any content from the PDF."})

        # 3. Create and persist the vector store
        vector_store = create_vector_store(chunks, metadata)

        # 4. Reload the vector store for searching
        embeddings = FastEmbedEmbeddings()
        # Allow dangerous deserialization is required for FAISS with older pickle versions
        vector_store = FAISS.load_local("vector_store", embeddings, allow_dangerous_deserialization=True)

        # 5. Retrieve balanced content across all identified topics
        retrieved_chunks = []
        # Get a list of unique topics that were generated
        unique_topics = sorted(list(set(m["topic_title"] for m in metadata)))
        
        # Calculate how many chunks to get per topic to not exceed a reasonable limit
        total_chunks_to_retrieve = 15
        k_per_topic = max(1, total_chunks_to_retrieve // len(unique_topics)) if unique_topics else 0

        print(f"Retrieving {k_per_topic} chunks per topic across {len(unique_topics)} unique topics.")

        for topic in unique_topics:
            results = vector_store.similarity_search(
                "Generate questions about this content", 
                k=k_per_topic, 
                filter={"topic_title": topic}
            )
            retrieved_chunks.extend(results)

        # 6. Merge the retrieved content, ensuring it's under a token cap
        content = "\n\n".join([doc.page_content for doc in retrieved_chunks])[:12000]

    # Assemble config
    config = {
        "Standard": Standard,
        "Subject_Name": Subject_Name,
        "difficulty": difficulty,
        "countOfMCQs": countOfMCQs,
        "countOfShort": countOfShort,
        "countOfLong": countOfLong,
        "User_defined_notes": User_defined_notes,
    }

    # Generate questions
    output = generate_questions_from_content(content, config)
    return JSONResponse(content={"question_paper": output})


@app.post("/generate-answer-key/")
async def generate_answer_key(question_paper: str = Form(...)):
    answer_key = generate_answer_key_from_question_paper(question_paper)
    return JSONResponse(content={"answer_key": answer_key})


@app.get("/health")
def health_check():
    return {"status": "Render is Alive"}
