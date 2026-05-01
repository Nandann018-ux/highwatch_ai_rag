import numpy as np
import torch
from sentence_transformers import SentenceTransformer
from typing import Optional
import google.generativeai as genai
from config import EMBEDDING_PROVIDER, GEMINI_API_KEY

# Limit threads to reduce memory footprint on Render
torch.set_num_threads(1)

# Load model once at module level (singleton — avoids reloading on every call)
_MODEL_NAME = "all-MiniLM-L6-v2"
_model: Optional[SentenceTransformer] = None


def _get_model() -> SentenceTransformer:
    """Lazy-load the sentence transformer model."""
    global _model
    if _model is None:
        print(f"[Embedder] Loading local model '{_MODEL_NAME}'...")
        _model = SentenceTransformer(_MODEL_NAME)
        print("[Embedder] Local model loaded.")
    return _model


def get_embeddings(texts: list[str]) -> np.ndarray:
    """
    Generate embeddings for a list of text strings.
    """
    if EMBEDDING_PROVIDER == "gemini":
        if not GEMINI_API_KEY:
            print("[Embedder] WARNING: GEMINI_API_KEY not found. Falling back to local.")
        else:
            try:
                print(f"[Embedder] Using Gemini API for {len(texts)} embeddings...")
                genai.configure(api_key=GEMINI_API_KEY)
                # Note: Gemini embedding-001 has 768 dims, all-MiniLM-L6-v2 has 384.
                # To maintain compatibility with existing FAISS index, we might need a choice.
                # However, for a fresh deploy, we'll just use the provider's default.
                result = genai.embed_content(
                    model="models/embedding-001",
                    content=texts,
                    task_type="retrieval_document"
                )
                embeddings = np.array(result['embedding'], dtype=np.float32)
                return embeddings
            except Exception as e:
                print(f"[Embedder] Gemini embedding error: {e}. Falling back to local.")

    # Local fallback
    model = _get_model()
    embeddings = model.encode(
        texts,
        batch_size=32,
        show_progress_bar=False,
        convert_to_numpy=True,
        normalize_embeddings=True,
    )
    return embeddings.astype(np.float32)


def get_single_embedding(text: str) -> np.ndarray:
    """
    Generate embedding for a single text string.
    """
    if EMBEDDING_PROVIDER == "gemini" and GEMINI_API_KEY:
        try:
            genai.configure(api_key=GEMINI_API_KEY)
            result = genai.embed_content(
                model="models/embedding-001",
                content=text,
                task_type="retrieval_query"
            )
            embedding = np.array(result['embedding'], dtype=np.float32)
            if embedding.ndim == 1:
                embedding = embedding.reshape(1, -1)
            return embedding
        except Exception as e:
            print(f"[Embedder] Gemini single embedding error: {e}. Falling back to local.")

    return get_embeddings([text])
