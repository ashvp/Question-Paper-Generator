import os
from typing import List, Dict

from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate


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
        # Assuming the response object has a 'content' attribute
        return response.content.strip()
    except Exception as e:
        # Fallback in case of API error
        print(f"LLM call failed for topic generation: {e}")
        return "General Topic"


def chunk_text_and_assign_topics(text: str, chunk_size: int = 2000, chunk_overlap: int = 300, chunks_per_topic: int = 5) -> tuple[List[str], List[Dict[str, str]]]:
    """
    Chunks text and assigns a semantic topic to each group of chunks using an LLM.
    This replaces the need for regex-based chapter splitting.
    """
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

    # 2. Initialize the LLM for topic generation
    # Using a powerful model for better topic understanding
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.3)

    all_chunks = []
    all_metadata = []

    # 3. Process chunks in batches to assign a single topic to a group
    for i in range(0, len(initial_chunks), chunks_per_topic):
        batch = initial_chunks[i:i + chunks_per_topic]
        combined_text_for_batch = "\n\n".join(batch)

        # Get a single topic for the entire batch
        topic_title = get_topic_for_text_batch(combined_text_for_batch, llm)
        print(f"Generated Topic: '{topic_title}' for chunks {i} to {i+len(batch)-1}")

        # Add the chunks from this batch to the main list
        all_chunks.extend(batch)
        # Assign the same generated topic to all chunks in this batch
        all_metadata.extend([{"topic_title": topic_title}] * len(batch))

    return all_chunks, all_metadata


def create_vector_store(texts: List[str], metadata: List[Dict[str, str]], persist_directory: str = "vector_store") -> FAISS:
    """Creates and saves FAISS vector store with metadata."""
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    vector_store = FAISS.from_texts(texts=texts, embedding=embeddings, metadatas=metadata)

    if not os.path.exists(persist_directory):
        os.makedirs(persist_directory)

    vector_store.save_local(persist_directory)
    return vector_store
