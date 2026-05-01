# DriveLens: Intelligent RAG System for Google Drive

DriveLens is a sophisticated Retrieval-Augmented Generation (RAG) platform designed to provide conversational intelligence over personal and enterprise document repositories stored on Google Drive. By integrating seamless OAuth authentication with advanced vector search, DriveLens allows users to query their private files and receive grounded, source-backed answers in real-time.

**Live Demo:** [https://highwatch-ai-rag.onrender.com/](https://highwatch-ai-rag.onrender.com/)

---

## System Overview

DriveLens implements a modern RAG pipeline that bridges the gap between static cloud storage and interactive AI. The system connects directly to a user's Google Drive, performs incremental synchronization of document fragments, and builds a high-performance neural index for low-latency retrieval.

### Key Capabilities
- **Direct Drive Integration:** Securely connects to Google Drive via OAuth 2.0 to access PDFs and text documents.
- **Incremental Synchronization:** Intelligently detects file modifications to update only changed content, minimizing API overhead.
- **Neural Retrieval:** Utilizes FAISS (Facebook AI Similarity Search) and advanced embedding models for precise semantic search.
- **Grounded Generation:** Leverages the Groq LPU™ Inference Engine for high-speed, factually grounded responses that cite specific source documents.
- **Responsive Interface:** A clean, professional dashboard providing real-time synchronization logs, document library management, and a dedicated AI assistant.

---

## Technical Architecture

The platform is built on a high-performance stack optimized for efficiency and scalability:

- **Frontend:** Vanilla JavaScript and CSS, ensuring maximum performance and zero dependency overhead.
- **Backend API:** FastAPI (Python), providing an asynchronous, high-throughput gateway.
- **Storage & Processing:** 
  - **Text Extraction:** PyPDF for robust parsing of complex document structures.
  - **Chunking:** Recursive character splitting with overlap to maintain semantic context.
  - **Vector Store:** FAISS (IndexFlatIP) for ultra-fast similarity calculations.
- **AI Intelligence:**
  - **Embeddings:** Support for both local SentenceTransformers and API-based Google Gemini embeddings (optimized for cloud environments).
  - **Inference:** Llama 3.3 (70B) via Groq for state-of-the-art reasoning and synthesis.

---

## Setup and Installation

### Prerequisites
- Python 3.10 or higher
- Google Cloud Console Project (with Drive API enabled)
- Groq API Key
- Google AI Studio (Gemini) API Key (optional, for optimized embeddings)

### Local Configuration
1. Clone the repository and navigate to the project root.
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file based on `.env.example` and populate it with your credentials:
   ```env
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GROQ_API_KEY=your_groq_api_key
   GEMINI_API_KEY=your_gemini_api_key
   EMBEDDING_PROVIDER=gemini
   ```

### Execution
Start the development server:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```
Access the dashboard at `http://localhost:8000`.

---

## Deployment Configuration

DriveLens is pre-configured for deployment on Render. The system includes specific optimizations for resource-constrained environments:

- **Memory Efficiency:** By utilizing API-based embeddings (Gemini), the system footprint is reduced to under 500MB RAM.
- **Dockerized Environment:** A clean, multi-stage build process ensures a lean production image.
- **Ephemeral Compatibility:** Designed to function without persistent disk requirements by leveraging cloud-based intelligence and incremental re-indexing.

---

## Google Cloud Console Requirements

To ensure successful authentication, configure your OAuth Consent Screen and Credentials as follows:

1. **Authorized JavaScript Origins:**
   - `http://localhost:8000`
   - `https://highwatch-ai-rag.onrender.com`
2. **Authorized Redirect URIs:**
   - `http://localhost:8000/auth/callback`
   - `https://highwatch-ai-rag.onrender.com/auth/callback`

---

## License and Attribution

This project was developed for the HighWatch AI RAG Assessment. It demonstrates advanced proficiency in AI integration, document processing, and full-stack system design.
