# 🚇 MetroGuard AI

### Agentic Metro Maintenance, Incident Monitoring & Intelligent Operations Platform

MetroGuard AI is a full-stack **AI-powered metro maintenance and incident management platform** designed to support railway operators and maintenance teams in monitoring metro systems, detecting abnormal sensor conditions, investigating incidents, retrieving relevant maintenance knowledge, and managing maintenance workflows.

The platform combines:

* 🤖 Agentic AI workflows
* 🧠 Retrieval-Augmented Generation (RAG)
* 🔎 FAISS-based knowledge retrieval
* 🦙 Local LLM inference with Ollama
* 📡 Real-time sensor monitoring
* 🚨 Incident detection and analysis
* 🛠️ Maintenance work-order management
* 👨‍🔧 Human approval workflows
* 📊 Operational analytics
* 🔌 REST APIs
* ⚡ WebSocket-based real-time communication
* 🐳 Docker and Docker Compose

---

# 🎯 Problem Statement

Metro systems continuously generate operational information from trains, sensors, maintenance activities, incidents, and technical documentation.

Manually monitoring and interpreting this information can make it difficult for maintenance teams to:

* Identify abnormal equipment behavior quickly
* Understand the context behind an incident
* Find relevant maintenance knowledge
* Prioritize critical incidents
* Assign maintenance work
* Track work-order progress
* Maintain an auditable operational workflow

MetroGuard AI addresses these challenges by combining real-time monitoring, AI-assisted analysis, knowledge retrieval, and human approval into one operational platform.

---

# 💡 Solution

MetroGuard AI provides an intelligent workflow for metro maintenance operations.

The system:

1. Receives simulated metro sensor data.
2. Stores telemetry information in the database.
3. Processes sensor readings through the application workflow.
4. Detects abnormal conditions.
5. Creates and manages incidents.
6. Retrieves relevant technical information through RAG.
7. Uses a local Ollama LLM to analyze incidents.
8. Generates AI summaries and recommendations.
9. Allows human operators to review and approve actions.
10. Creates and manages maintenance work orders.
11. Records operational activity for auditing.
12. Displays system information through a React dashboard.

---

# ✨ Key Features

## 📊 Operational Dashboard

The dashboard provides a centralized view of:

* Train status
* Active incidents
* Critical alerts
* Open maintenance work orders
* AI recommendations
* System health
* Recent operational alerts

The backend exposes this functionality through:

```text
GET /api/dashboard
```

The dashboard API calculates operational statistics from the database and provides critical incident information to the frontend.

---

## 📡 Real-Time Sensor Monitoring

MetroGuard AI supports sensor telemetry for metro trains.

Sensor data includes:

* Train ID
* Metro line
* Station
* Speed
* Vibration
* Axle temperature
* Brake temperature
* Track temperature
* Timestamp

Available endpoints include:

```text
GET  /api/sensors
GET  /api/sensors/{train_id}
POST /api/sensors/events
```

The backend also broadcasts sensor events through a WebSocket connection:

```text
/ws/sensors
```

This allows the frontend to receive real-time sensor updates.

---

# 🚨 Incident Management

MetroGuard AI maintains an incident management workflow for abnormal operational conditions.

Users can:

* View incidents
* View individual incidents
* Analyze incidents using AI
* Update incident status
* Trigger maintenance-related actions
* Connect incidents with maintenance work orders

Endpoints include:

```text
GET  /api/incidents
GET  /api/incidents/{incident_id}
POST /api/incidents/{incident_id}/analyze
```

The incident analysis pipeline retrieves telemetry information and relevant knowledge before sending the contextual information to the local LLM.

---

# 🧠 AI-Powered Incident Analysis

When an incident is analyzed, MetroGuard AI combines multiple sources of information:

```text
Incident
   │
   ├── Incident Details
   │
   ├── Sensor Telemetry
   │
   └── Relevant Knowledge
          │
          ▼
     RAG Retrieval
          │
          ▼
     Ollama LLM
          │
          ▼
   AI Incident Analysis
          │
          ├── Confidence
          ├── Summary
          └── Recommendation
```

The incident analysis implementation retrieves evidence through the RAG retriever and then passes the incident, severity, telemetry, and retrieved documents to the Ollama-based analysis service.

---

# 🔎 Retrieval-Augmented Generation (RAG)

MetroGuard AI includes a dedicated RAG pipeline.

The RAG implementation contains:

```text
backend/app/rag/
│
├── embeddings.py
├── ingest.py
├── retriever.py
└── vector_store.py
```

The system uses these components to:

1. Ingest maintenance knowledge.
2. Process knowledge into searchable representations.
3. Retrieve relevant evidence.
4. Provide the retrieved information to the AI analysis workflow.

The project also maintains:

```text
backend/rag_index.json
```

for the generated retrieval index.

---

## 📚 Knowledge Base

MetroGuard AI maintains domain-specific knowledge under:

```text
backend/knowledge/
```

The backend exposes knowledge-management APIs:

```text
GET  /api/knowledge/documents
POST /api/knowledge/ingest
GET  /api/knowledge/search?q=<query>
```

These APIs allow the system to:

* View indexed knowledge documents
* Rebuild the knowledge index
* Search technical knowledge
* Provide relevant evidence for AI analysis

---

# 🤖 Agentic AI Architecture

MetroGuard AI contains an agent-based workflow implemented using LangGraph.

The agent system is organized under:

```text
backend/app/agents/
│
├── graph.py
├── nodes.py
├── routing.py
└── state.py
```

The agent workflow is designed to coordinate operational reasoning and actions across the maintenance process.

Conceptually:

```text
                 ┌──────────────────┐
                 │  Sensor / Event  │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ Agent Workflow   │
                 └────────┬─────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Incident │ │   RAG    │ │  Tools   │
        │ Analysis │ │ Retrieval│ │  Actions │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │            │            │
             └────────────┼────────────┘
                          ▼
                 ┌──────────────────┐
                 │  AI Recommendation│
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ Human Approval   │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ Maintenance Work │
                 │      Order       │
                 └──────────────────┘
```

---

# 👨‍🔧 Human-in-the-Loop Workflow

MetroGuard AI does not treat AI output as an automatic safety decision.

The platform includes an approval workflow where human operators can review operational recommendations before maintenance actions are finalized.

The backend exposes:

```text
GET /api/approvals
```

This provides visibility into approval records and supports an auditable decision-making process.

---

# 🛠️ Maintenance Work Orders

MetroGuard AI includes maintenance work-order management.

The system supports:

```text
GET /api/work-orders
GET /api/work-orders/{work_order_id}
PUT /api/work-orders/{work_order_id}
```

Work orders can be associated with:

* Incidents
* Technicians
* Maintenance status
* Resolution information

The platform also maintains technician information and availability as part of the maintenance workflow.

---

# 📈 Analytics

The analytics module provides operational statistics for the dashboard.

Endpoint:

```text
GET /api/analytics
```

The analytics system provides information such as:

* Incidents by metro line
* Incidents by type
* Incident trends
* Approval-related information
* Maintenance-related statistics

The frontend uses this information to present operational charts and insights.

---

# 🔌 API Overview

MetroGuard AI exposes a FastAPI backend.

## Health Check

```text
GET /api/health
```

Example response:

```json
{
  "status": "healthy",
  "service": "MetroGuard AI API"
}
```

## Dashboard

```text
GET /api/dashboard
```

## Sensors

```text
GET  /api/sensors
GET  /api/sensors/{train_id}
POST /api/sensors/events
```

## Incidents

```text
GET  /api/incidents
GET  /api/incidents/{incident_id}
POST /api/incidents/{incident_id}/analyze
```

## Approvals

```text
GET /api/approvals
```

## Work Orders

```text
GET /api/work-orders
GET /api/work-orders/{work_order_id}
PUT /api/work-orders/{work_order_id}
```

## Knowledge

```text
GET  /api/knowledge/documents
POST /api/knowledge/ingest
GET  /api/knowledge/search?q=<query>
```

## Analytics

```text
GET /api/analytics
```

## WebSocket

```text
/ws/sensors
```

---

# 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │   Metro Sensors     │
                    │  Simulated Telemetry│
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   FastAPI Backend   │
                    └──────────┬──────────┘
                               │
            ┌──────────────────┼───────────────────┐
            │                  │                   │
            ▼                  ▼                   ▼
      ┌───────────┐      ┌───────────┐      ┌───────────┐
      │ PostgreSQL│      │  Incident │      │ WebSocket │
      │ / SQLite  │      │  Workflow │      │  Sensors  │
      └───────────┘      └─────┬─────┘      └───────────┘
                               │
                               ▼
                       ┌───────────────┐
                       │ RAG Retriever │
                       └───────┬───────┘
                               │
                               ▼
                       ┌───────────────┐
                       │ FAISS / Index │
                       └───────┬───────┘
                               │
                               ▼
                       ┌───────────────┐
                       │ Ollama / LLM  │
                       └───────┬───────┘
                               │
                               ▼
                       ┌───────────────┐
                       │ AI Analysis & │
                       │ Recommendation│
                       └───────┬───────┘
                               │
                               ▼
                       ┌───────────────┐
                       │ Human Approval│
                       └───────┬───────┘
                               │
                               ▼
                       ┌───────────────┐
                       │ Work Orders   │
                       └───────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ React + TypeScript  │
                    │ Operations Dashboard│
                    └─────────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

* React 18
* TypeScript
* Vite
* React Router
* Axios
* Recharts
* Lucide React
* Tailwind CSS

These dependencies are defined in the project's `frontend/package.json`.

## Backend

* Python
* FastAPI
* Uvicorn
* Pydantic
* SQLAlchemy
* PostgreSQL
* SQLite
* WebSockets

The backend dependency list is defined in `backend/requirements.txt`.

## AI / Agentic Systems

* LangGraph
* LangChain
* LangChain Core
* LangChain Community
* Ollama
* Local LLM inference
* Retrieval-Augmented Generation
* FAISS-based retrieval

The backend requirements specifically include LangGraph, LangChain packages, and the application integrates Ollama through its configuration.

## Database

### Local Development

```text
SQLite
```

### Docker / Production-style Setup

```text
PostgreSQL 15
```

The Docker Compose configuration creates a PostgreSQL 15 service and connects the backend to it.

## Infrastructure

* Docker
* Docker Compose
* Git
* GitHub

---

# 📂 Project Structure

```text
metroguard-ai/
│
├── backend/
│   │
│   ├── app/
│   │   ├── agents/
│   │   │   ├── graph.py
│   │   │   ├── nodes.py
│   │   │   ├── routing.py
│   │   │   └── state.py
│   │   │
│   │   ├── api/
│   │   │   ├── analytics.py
│   │   │   ├── approvals.py
│   │   │   ├── audit.py
│   │   │   ├── dashboard.py
│   │   │   ├── incidents.py
│   │   │   ├── knowledge.py
│   │   │   ├── sensors.py
│   │   │   ├── work_orders.py
│   │   │   └── ws.py
│   │   │
│   │   ├── core/
│   │   ├── db/
│   │   ├── llm/
│   │   ├── models/
│   │   ├── rag/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── tools/
│   │   └── main.py
│   │
│   ├── knowledge/
│   ├── tests/
│   ├── .env.example
│   ├── Dockerfile
│   ├── metroguard.db
│   ├── rag_index.json
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── dist/
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── scripts/
│
├── docker-compose.yml
│
└── README.md
```

The repository currently follows this frontend/backend structure, with the backend organized into agents, API routers, RAG, LLM, database, models, schemas, services, and tools.

---

# ⚙️ Local Setup

## Prerequisites

Install:

* Python 3.10+
* Node.js
* npm
* Git
* Ollama
* Docker Desktop (optional)

---

# 🦙 Ollama Setup

MetroGuard AI uses Ollama for local LLM inference.

Install Ollama and pull the configured model:

```bash
ollama pull llama3
```

Start Ollama:

```bash
ollama serve
```

The default backend configuration is:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

These values are defined in the repository's `.env.example`.

---

# 🐍 Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Activate it on macOS/Linux:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create your environment file:

```bash
copy .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

Start the FastAPI backend:

```bash
uvicorn app.main:app --reload --port 8000
```

Backend:

```text
http://localhost:8000
```

Health check:

```text
http://localhost:8000/api/health
```

FastAPI documentation:

```text
http://localhost:8000/docs
```

---

# 💻 Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend runs on the Vite development server, typically:

```text
http://localhost:5173
```

---

# 🐳 Docker Setup

The repository includes a Docker Compose configuration containing:

```text
PostgreSQL
Backend
Frontend
```

The PostgreSQL service uses:

```text
postgres:15-alpine
```

The backend runs on:

```text
8000
```

and the frontend on:

```text
5173
```

The Docker configuration also connects the backend to PostgreSQL and exposes Ollama through the Docker host.

Run the complete stack:

```bash
docker compose up --build
```

Stop the stack:

```bash
docker compose down
```

---

# 🔐 Environment Configuration

The repository provides:

```text
backend/.env.example
```

Current configuration includes:

```env
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
```

The application is designed to use SQLite locally and can use PostgreSQL when configured accordingly.

> Never commit real secrets or private environment variables to GitHub.

---

# 🧪 Testing

Backend tests are located under:

```text
backend/tests/
```

Run:

```bash
pytest
```

---

# 🔄 End-to-End Workflow

```text
Sensor Event
     │
     ▼
FastAPI Sensor API
     │
     ▼
Database
     │
     ▼
Agentic Workflow
     │
     ├───────────────┐
     │               │
     ▼               ▼
Anomaly /       Sensor Context
Incident             │
     │               │
     └───────┬───────┘
             ▼
       RAG Retrieval
             │
             ▼
      Relevant Knowledge
             │
             ▼
        Ollama LLM
             │
             ▼
      AI Incident Analysis
             │
             ├── Confidence
             ├── Summary
             └── Recommendation
             │
             ▼
       Human Approval
             │
             ▼
      Maintenance Action
             │
             ▼
       Work Order
             │
             ▼
        Audit Trail
```

---

# 📌 Example Operational Scenario

### Scenario: Abnormal Train Vibration

A simulated train sends sensor telemetry:

```text
Train: MTR-204
Line: Blue
Station: Ameerpet
Vibration: Abnormally High
Brake Temperature: Normal
Axle Temperature: Elevated
```

MetroGuard AI processes the event and can:

1. Store the sensor reading.
2. Detect an abnormal condition.
3. Create an incident.
4. Retrieve relevant maintenance knowledge.
5. Analyze the incident using the local LLM.
6. Generate an AI summary and recommendation.
7. Present the recommendation to an operator.
8. Obtain human approval.
9. Create or update a maintenance work order.
10. Record the action for auditing.

---

# 🛡️ Human Oversight & Safety

MetroGuard AI is intended as an **AI-assisted decision-support platform**.

AI-generated recommendations should be reviewed by qualified maintenance or operations personnel before being used for real-world safety-critical decisions.

The system is designed to assist humans by:

* Reducing manual analysis
* Retrieving relevant technical knowledge
* Explaining abnormal conditions
* Organizing incidents
* Supporting maintenance planning
* Maintaining an operational audit trail

---

# 🚀 Future Enhancements

Potential improvements include:

* Real railway IoT sensor integration
* Live telemetry streaming
* Advanced predictive-maintenance ML models
* Computer vision for infrastructure inspection
* Automated incident prioritization
* Multi-agent maintenance planning
* Voice-based maintenance assistant
* Advanced failure prediction
* Cloud-based deployment
* Role-based authentication
* Notification and alert services
* Historical maintenance analytics
* Integration with real railway asset-management systems

---

# 📊 Project Highlights

| Capability          | Implementation                    |
| ------------------- | --------------------------------- |
| Frontend            | React + TypeScript + Vite         |
| Backend             | FastAPI + Python                  |
| Database            | SQLite / PostgreSQL               |
| AI                  | Local Ollama LLM                  |
| Agentic AI          | LangGraph                         |
| RAG                 | LangChain + FAISS-based retrieval |
| Sensor Monitoring   | REST + WebSocket                  |
| Incident Management | FastAPI APIs                      |
| Maintenance         | Work-order workflow               |
| Human-in-the-Loop   | Approval system                   |
| Analytics           | React charts + backend analytics  |
| Deployment          | Docker Compose                    |

---

# 👨‍💻 Author

**Chodabathula Mohana Rangaji**

Computer Science Engineering
AI / GenAI Developer | Full Stack Developer

GitHub:
https://github.com/mohan-1705/metroguard-ai

---

# ⭐ MetroGuard AI

**MetroGuard AI — Intelligent monitoring, AI-assisted incident analysis, and maintenance workflow automation for modern metro operations.**
