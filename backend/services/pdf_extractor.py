import os
from typing import List, Dict
from dotenv import load_dotenv
from pathlib import Path

from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate

# Load environment variables from .env file
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract raw text from all pages of a PDF."""
    try:
        text = ""
        pdf_reader = PdfReader(pdf_path)
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {e}")


def get_topic_for_text_batch(text_batch: str, llm) -> str:
    """Uses an LLM to generate a concise topic title for a batch of text."""
    prompt_template = ChatPromptTemplate.from_template(
        "Analyze the following text extracted from a document. Based on the content, create a concise and descriptive topic title (4-8 words) that summarizes what this section is about. This title will be used to group related content. Do not add any prefixes like 'Topic:'.\n\n---\n{text}\n---"
    )
    chain = prompt_template | llm
    try:
        response = chain.invoke({"text": text_batch})
        return response.content.strip()
    except Exception as e:
        # Fallback in case of API error
        print(f"LLM call failed for topic generation: {e}")
        return "General Topic"


def chunk_text_and_assign_topics(
    text: str, 
    chunk_size: int = 2000, 
    chunk_overlap: int = 300, 
    chunks_per_topic: int = 20 
) -> tuple[List[str], List[Dict[str, str]]]:
    """
    Chunks text and assigns a semantic topic to each group of chunks using an LLM.
    Optimized for large documents (500+ pages).
    """
    # Verify API key is present
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError(
            "❌ GROQ_API_KEY not found in environment variables. "
            "Please add it to your .env file: GROQ_API_KEY=your_key_here"
        )
    
    # 1. Use a recursive splitter for more context-aware chunking
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        is_separator_regex=False,
    )
    initial_chunks = text_splitter.split_text(text)

    if not initial_chunks:
        return [], []

    print(f"📄 Processing {len(initial_chunks)} chunks from document...")

    # 2. Initialize Groq LLM for topic generation
    llm = ChatGroq(
        api_key=api_key,
        model="llama-3.1-8b-instant",
        temperature=0.2
    )

    all_chunks = []
    all_metadata = []

    # 3. Process chunks in batches to assign a single topic to a group
    total_batches = (len(initial_chunks) + chunks_per_topic - 1) // chunks_per_topic
    
    for i in range(0, len(initial_chunks), chunks_per_topic):
        batch_num = (i // chunks_per_topic) + 1
        batch = initial_chunks[i:i + chunks_per_topic]
        
        combined_text_for_batch = "\n\n".join(batch)[:8000]  

        topic_title = get_topic_for_text_batch(combined_text_for_batch, llm)
        print(f"✅ [{batch_num}/{total_batches}] Topic: '{topic_title}' (chunks {i} to {i+len(batch)-1})")

        # Add the chunks from this batch to the main list
        all_chunks.extend(batch)
        # Assign the same generated topic to all chunks in this batch
        all_metadata.extend([{"topic_title": topic_title}] * len(batch))

    print(f"🎯 Total chunks with topics: {len(all_chunks)}")
    return all_chunks, all_metadata


def create_vector_store(
    texts: List[str], 
    metadata: List[Dict[str, str]], 
    persist_directory: str = "vector_store"
) -> FAISS:
    """
    Creates and saves FAISS vector store with metadata.
    Optimized for large documents using local embeddings (no API quota).
    """
    print(f"🚀 Creating embeddings for {len(texts)} chunks...")
    print("⏳ This may take 45-90 seconds for large documents...")
    
    # Use local embeddings - NO API QUOTA NEEDED!
    # embeddings = HuggingFaceEmbeddings(
    #     model_name="sentence-transformers/all-MiniLM-L6-v2",
    #     model_kwargs={
    #         'device': 'cpu',
    #         'normalize_embeddings': True
    #     },
    #     encode_kwargs={
    #         'batch_size': 128,  # Optimal batch size for CPU
    #         'show_progress_bar': True,
    #         'normalize_embeddings': True
    #     }
    # )
    embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

    
    try:
        vector_store = FAISS.from_texts(
            texts=texts, 
            embedding=embeddings, 
            metadatas=metadata
        )

        if not os.path.exists(persist_directory):
            os.makedirs(persist_directory)

        vector_store.save_local(persist_directory)
        print(f"✅ Vector store saved successfully with {len(texts)} embeddings!")
        return vector_store
        
    except Exception as e:
        print(f"❌ Error creating vector store: {e}")
        raise