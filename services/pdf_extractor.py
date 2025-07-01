from PyPDF2 import PdfReader
from langchain.text_splitter import CharacterTextSplitter
import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS

def extract_text_from_pdf(pdfDocs) -> list[str]:
    try:
        text = ""
        # for pdf in pdfDocs:
        pdf_reader = PdfReader(pdfDocs) 
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text

    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {e}")

def get_chunks_from_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> list[str]:
    text_splitter = CharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len
    )
    return text_splitter.split_text(text)

def create_vector_store_from_chunks(chunks: list[str], persist_directory: str = "vector_store") -> FAISS:
    embeddings = GoogleGenerativeAIEmbeddings(model = "models/embedding-001")
    vector_store = FAISS.from_texts(texts = chunks, embedding = embeddings)
    
    # Persist the vector store to disk
    if not os.path.exists(persist_directory):
        os.makedirs(persist_directory)
    vector_store.save_local(persist_directory)
    
    return vector_store

