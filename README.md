# 🚇 MetroGuard AI

### AI-Powered Metro Maintenance, Incident Monitoring & Intelligent Operations Platform

MetroGuard AI is an AI-powered metro operations and maintenance platform that combines **LLMs, Retrieval-Augmented Generation (RAG), real-time sensor monitoring, anomaly detection, and human-in-the-loop workflows**.

It processes simulated metro sensor data, detects anomalies, creates incidents, retrieves relevant maintenance knowledge, analyzes incidents using **Llama 3**, and supports human-approved maintenance workflows.

> ⚠️ **Safety Notice:** This is a simulation and decision-support project. It does not control real trains, railway signals, braking systems, tracks, or railway infrastructure.

---

## 📌 Overview

```text
Sensor Data
    ↓
Data Validation
    ↓
Anomaly Detection
    ↓
Incident Creation
    ↓
RAG Knowledge Retrieval
    ↓
Llama 3 Analysis
    ↓
AI Recommendation
    ↓
Human Approval
    ↓
Maintenance Work Order
    ↓
Audit & Monitoring
✨ Key Features
🚇 Simulated metro sensor monitoring
📊 Real-time monitoring dashboard
🚨 Anomaly and incident detection
🤖 LLM-powered incident analysis
📚 Retrieval-Augmented Generation (RAG)
🔍 FAISS vector search
🧠 Local Ollama + Llama 3
👨‍💼 Human-in-the-loop approval
🛠️ Simulated maintenance work orders
👷 Technician assignment workflow
📡 WebSocket real-time updates
📝 Audit logging
📈 Operational analytics
🤖 AI & RAG Architecture

MetroGuard AI uses Ollama + Llama 3 with FAISS-based RAG.

Incident / Sensor Event
        ↓
Query Construction
        ↓
FAISS Search
        ↓
Top-K Relevant Documents
        ↓
Retrieved Context
        ↓
Llama 3
        ↓
Structured AI Analysis
        ↓
Human Approval
RAG Configuration
Vector Store : FAISS
Top-K        : 3
Chunk Size   : 500
Index Path   : rag_index

RAG provides relevant maintenance knowledge to the LLM before generating its analysis.

🧠 Local LLM

The project runs the LLM locally using Ollama, so no external AI API key is required.

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

Benefits:

Local inference
No external AI API dependency
Better control over application data
Easy development and testing
🏗️ Architecture
        Simulated Metro Sensors
                 ↓
          FastAPI Backend
                 ↓
       ┌─────────┼─────────┐
       ↓         ↓         ↓
   Anomaly    Incident   WebSocket
  Detection   Management   Events
       └─────────┼─────────┘
                 ↓
             RAG / FAISS
                 ↓
           Ollama / Llama 3
                 ↓
         AI Recommendation
                 ↓
          Human Approval
                 ↓
        Maintenance Workflow
                 ↓
           SQLite Database
🛠️ Tech Stack
Category	Technologies
Frontend	React, Vite, Tailwind CSS, Axios, Recharts
Backend	Python, FastAPI, Pydantic, Uvicorn, SQLAlchemy
Database	SQLite
AI/LLM	Ollama, Llama 3, Prompt Engineering
RAG	FAISS, Vector Embeddings, Similarity Search
Real-Time	WebSockets
Development	Git, GitHub, VS Code
⚙️ Configuration

MetroGuard AI uses local services and does not require external API keys.

DATABASE_URL=sqlite:///metroguard.db

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

FAISS_INDEX_PATH=rag_index
TOP_K=3
CHUNK_SIZE=500

VITE_API_BASE_URL=http://localhost:8000
WEBSOCKET_URL=ws://localhost:8000/ws/sensors
FRONTEND_ORIGIN=http://localhost:5173
PORT=8000
🚨 Anomaly Detection

The system processes simulated metro telemetry and uses deterministic thresholds to identify abnormal conditions.

Example parameters:

Vibration
Axle Temperature
Brake Temperature
Track Temperature
Sensor Event
     ↓
Validate Data
     ↓
Check Thresholds
     ↓
Detect Anomaly
     ↓
Create Incident

Deterministic checks are performed before AI analysis so that the LLM is not solely responsible for numerical anomaly detection.

👨‍💼 Human-in-the-Loop

High-severity incidents follow a human-supervised workflow:

AI Analysis
     ↓
Recommendation
     ↓
Human Review
   ↙       ↘
Approve   Reject
   ↓        ↓
Work Order Audit

AI recommendations do not directly control railway infrastructure.

📡 Real-Time Monitoring

WebSockets provide real-time communication between the backend and frontend.

ws://localhost:8000/ws/sensors

Used for updating:

Sensor readings
Incident notifications
Incident status
Dashboard information
Maintenance workflow updates
🗄️ Database

MetroGuard AI uses SQLite for lightweight local development.

metroguard.db

The architecture can be migrated to PostgreSQL for larger production deployments.

🚀 Getting Started
Prerequisites
Python 3.10+
Node.js & npm
Ollama
Git
1. Clone
git clone https://github.com/mohan-1705/metroguard-ai.git
cd metroguard-ai
2. Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
3. Ollama
ollama pull llama3

Ollama runs at:

http://localhost:11434
4. Frontend
cd frontend
npm install
npm run dev

Frontend:

http://localhost:5173
🔄 End-to-End Workflow
Sensor Event
     ↓
Anomaly Detection
     ↓
Incident Created
     ↓
RAG Retrieval
     ↓
Llama 3 Analysis
     ↓
AI Recommendation
     ↓
Human Approval
     ↓
Maintenance Work Order
     ↓
Technician Assignment
     ↓
Audit Log
🎯 Use Cases
Metro maintenance monitoring
Operational incident management
AI-assisted maintenance analysis
Sensor anomaly detection
Maintenance knowledge retrieval
Intelligent incident triage
Human-supervised AI workflows
Real-time transportation monitoring
🔮 Future Enhancements
Predictive maintenance models
Real metro/IoT data integration
Advanced time-series anomaly detection
Computer vision for station monitoring
Multi-agent maintenance workflows
MCP-based tool integration
Role-based authentication
Cloud deployment
Advanced notifications
Historical analytics
AI model evaluation and observability
🛡️ Safety & Limitations

MetroGuard AI is a simulation and research/portfolio project.

It does not directly operate trains, signals, braking systems, track switching, or railway control infrastructure.

All sensor data and maintenance workflows are simulated, and AI recommendations should be reviewed by qualified humans before any real-world operational decision.

📈 Project Highlights

MetroGuard AI demonstrates the integration of:

Python + FastAPI + React
        ↓
SQLite + WebSockets
        ↓
FAISS + RAG
        ↓
Ollama + Llama 3
        ↓
AI Recommendations
        ↓
Human-in-the-Loop Automation

The project goes beyond a standalone chatbot by integrating an LLM into a structured operational workflow with retrieval, deterministic checks, human approval, and auditability.

👨‍💻 Author

Chodabathula Mohana Rangaji

Computer Science Engineering Graduate

Interests: Generative AI • AI Agents • LLMs • RAG • Full-Stack Development • Python • Machine Learning • Data Analytics

GitHub:
https://github.com/mohan-1705
