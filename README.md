# 🧠 AI PDF Files Organizer

**Author:** Manoj Mannam  
**Duration:** Jan 2025 – Mar 2025  
**Technologies:** TypeScript, JavaScript, Supabase (SQL), LangChain, Xenova Transformers  

---

## 📘 Project Overview

The **AI PDF Files Organizer** is an intelligent file management system designed to make handling PDFs more efficient and user-friendly.  
It allows users to **upload, organize, search, and query PDFs** using **AI-driven semantic understanding**.

Traditional file managers rely on keyword-based searches, which can miss context.  
This system integrates **Transformer-based models** and **LangChain orchestration** to enable **semantic search, automatic tagging, and question-answering (Q&A)** on PDFs.

---

## ✨ Features

### 🧾 1. PDF Upload and Text Extraction
- Upload PDF files via a simple web interface.  
- Extracts text from PDFs for further processing and embedding generation.

### 🔍 2. Semantic Search
- Search PDFs using natural language queries instead of keywords.  
- Transformer models generate embeddings for text and queries to find semantically related documents.

### 💬 3. Document-Level Question Answering (Q&A)
- Ask questions about a specific PDF.  
- The system retrieves the most relevant sections using embeddings and provides AI-generated answers.

### 🏷️ 4. Smart Tagging and Categorization
- Automatically generates topic-based tags for PDFs using embeddings.  
- Uses hash maps and sets for efficient tag management and duplicate avoidance.

### 📥 5. File Download and Quick Access
- Users can view or download PDFs after searching or querying results.  

---

## 🧩 Tech Stack

- **Frontend:** TypeScript, JavaScript  
- **Backend / Database:** Supabase (SQL + Storage for PDFs)  
- **AI / ML:** LangChain (workflow orchestration), Xenova Transformers (embedding generation and semantic understanding)

---

## 🏗️ Architecture

### 1. Frontend (TypeScript / JavaScript)
- Handles user interactions like uploads, searches, and Q&A queries.  
- Displays organized and ranked search results.

### 2. Database (Supabase)
- Stores metadata, extracted text, embeddings, and tags.  
- PDF files themselves are stored in **Supabase Storage Buckets**.  
- Metadata includes filename, upload date, file path, extracted text, and generated embeddings.

### 3. AI Layer (LangChain + Transformers)
- **LangChain** orchestrates the workflow from text extraction to query response.  
- **Xenova Transformers** generate vector embeddings that capture the semantic meaning of text.

### 4. Data Structures Used
- **Arrays/Vectors:** Store embeddings and search results.  
- **Hash Maps/Dictionaries:** Map tags to PDF files for quick retrieval.  
- **Sets:** Ensure no duplicate tags or text chunks.  
- **Prefix/Suffix Arrays:** Used optionally for scoring or text ranking.

---

## ⚙️ Workflow

1. **PDF Upload:** User uploads a PDF → text is extracted and processed.  
2. **Embedding Generation:** Transformer models (Xenova) convert text into embeddings.  
3. **Storage:** Embeddings and metadata are stored in Supabase SQL; PDFs in Supabase Storage.  
4. **Query / Search:**  
   - User enters a query or question.  
   - Query text → converted to embedding → compared with stored embeddings using cosine similarity.  
5. **Answer Generation:**  
   - The system retrieves the most relevant chunks.  
   - LangChain coordinates the workflow and returns an AI-generated answer.  
6. **Display Results:** Ranked PDFs or text responses are shown to the user.

---

## 🗄️ Storage Details

### 🧱 Supabase Database
- **Stores:** Metadata, text, embeddings, tags, and file URLs.  
- **Embedding Storage:**  
  - Stored as **JSON** or **float arrays** in SQL columns.  
  - Allows easy retrieval and comparison during semantic search.

### ☁️ Supabase Storage
- **Stores:** Actual PDF files in a bucket.  
- **Database link:** Each entry in the metadata table contains a reference (URL/path) to its file in the bucket.

---

## 📊 User Validation

- Conducted a user survey to test usability and accuracy.  
- **80% of users** found this AI-based organizer more effective than traditional file managers.  
- Key feedback highlights included **faster search**, **relevant results**, and **ease of use**.

---

## 🧠 Why LangChain and Transformers

### LangChain
- An **open-source orchestration framework** that helps chain together AI tasks.  
- Simplifies managing multiple steps like text extraction → embedding → querying → response.  
- Provides an easy-to-maintain pipeline for AI workflows.

### Xenova Transformers
- Lightweight, pre-trained transformer models for JavaScript/TypeScript.  
- Efficient for **embedding generation** and **semantic understanding** without heavy GPU requirements.  
- Converts text into vector embeddings for **semantic similarity search**.

---

## 🧩 Data Structures Summary

| Data Structure | Purpose |
|----------------|----------|
| **Array / Vector** | Store embeddings and query results |
| **Hash Map** | Map tags or file names to embeddings |
| **Set** | Prevent duplicate tags or chunks |
| **Prefix/Suffix Array** | Optional ranking or scoring utility |

---
