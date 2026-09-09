# Network Security Compliance Automation

Analyze network device configurations against CIS and NIST security standards. Automated compliance checking with AI-powered normalization for Cisco and Juniper devices.

## Features

- 🔍 **AI-Powered Analysis**: Ollama-based LLM normalizes vendor-specific configs
- ✅ **Compliance Checking**: Deterministic rule evaluation against CIS/NIST standards
- 📊 **Detailed Reports**: JSON and PDF compliance reports
- 🔄 **Cisco ↔ Juniper Translation**: RAG-powered config translation
- 🌐 **Web Interface**: Clean, minimal frontend for easy uploads

## Quick Start

### Option 1: Automated Setup (Recommended)

#### Windows (Batch)
```bash
start.bat
```

#### Windows (PowerShell)
```powershell
.\start.ps1
```

This will:
1. Activate the virtual environment
2. Start the Django backend
3. Open the frontend in your browser

### Option 2: Manual Setup

#### 1. Activate Virtual Environment

**PowerShell:**
```powershell
.\.venv\Scripts\Activate.ps1
```

**CMD:**
```cmd
.venv\Scripts\activate.bat
```

#### 2. Apply Migrations (First Time Only)

```bash
python manage.py migrate
```

#### 3. Run the Server

```bash
python manage.py runserver
```

#### 4. Open Frontend

Open `frontend/index.html` in your browser, or navigate to:
```
http://127.0.0.1:8000
```

## Usage

### Web Interface (Recommended)

1. Open `frontend/index.html` in your browser
2. Select vendor (Cisco or Juniper)
3. Upload configuration file
4. Click "Analyze Configuration"
5. View results and download PDF

### API (Command Line)

#### Upload Configuration

**Single File:**
```bash
curl -X POST "http://127.0.0.1:8000/api/uploads/" ^
  -F "config=@sample_config.txt" ^
  -F "vendor=cisco"
```

**Multiple Files:**
```bash
curl -X POST "http://127.0.0.1:8000/api/uploads/" ^
  -F "config=@sample_config.txt" ^
  -F "vendor=cisco" ^
  -F "config=@sample_config_juniper.txt" ^
  -F "vendor=juniper"
```

#### View Report

```bash
python view_report.py <upload_id>
```

#### Download PDF

```bash
curl -X GET "http://127.0.0.1:8000/api/uploads/report/pdf/?ids=<upload_id>" ^
  --output report.pdf
```

## RAG System

### Index Knowledge Base

```bash
cd rag
python index.py --wipe
```

This indexes PDF/DOCX documentation into the vector database.

### RAG Chatbot

**Interactive Mode:**
```bash
cd rag
python rag_chatbot.py
```

**One-shot Query:**
```bash
cd rag
python rag_chatbot.py "What is the Junos equivalent of ip ssh timeout?"
```

**Cisco → Juniper Translation:**
```bash
cd rag
python rag_chatbot.py "hostname Router-01
ip ssh version 2
ntp server 10.0.0.1"
```

## Project Structure

```
Security_Compilence/
├── frontend/              # Web interface (HTML/CSS/JS)
│   ├── index.html        # Main page
│   ├── style.css         # Minimal styling
│   └── script.js         # API integration
├── core/                 # Device management & API
├── ai_engine/            # LLM normalization
├── compliance/           # Rule engine & remediation
├── rag/                  # RAG system & translator
│   ├── core/            # Vector store & retrieval
│   ├── translator/      # Cisco→Juniper pipeline
│   └── knowledge_base/  # PDF/DOCX documentation
├── config/              # Django settings
└── sample_config*.txt   # Test files
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/uploads/` | POST | Upload & analyze config(s) |
| `/api/uploads/<id>/` | GET | Retrieve upload details |
| `/api/uploads/<id>/remediation/propose/` | POST | Generate fix commands |
| `/api/uploads/<id>/remediation/execute/` | POST | Execute fixes (requires confirm) |
| `/api/uploads/report/pdf/?ids=...` | GET | Download PDF report |

## Requirements

- Python 3.8+
- PostgreSQL 18 with pgvector
- Ollama (local LLM)
- Modern web browser

## Configuration

### Environment Variables

Create `.env` file:
```
OLLAMA_BASE_URL=http://localhost:11434
RAG_DB_HOST=localhost
RAG_DB_PORT=5432
RAG_DB_USER=postgres
RAG_DB_PASSWORD=your_password
RAG_DB_NAME=rag_chatbot
```

### Database Setup

**PostgreSQL:**
```sql
CREATE DATABASE Security_Compliance;
CREATE DATABASE rag_chatbot;
CREATE EXTENSION vector;
```

### Ollama Setup

```bash
# Pull the model
ollama pull hf.co/empero-ai/Qwen3.8-4B-Distill-GGUF:Q4_K_M

# Or use a different model
ollama pull qwen2.5:3b
```

## Development

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run Tests

```bash
python manage.py test
```

## Sample Files

- `sample_config.txt` - Cisco IOS configuration
- `sample_config_juniper.txt` - Juniper Junos configuration

## Architecture

**Workflow:**
```
Upload → AI Normalize → Validate → Reinforce → 
Compliance Check → Report → Remediation (optional)
```

**Key Features:**
- ✅ Deterministic compliance engine (audit-safe)
- ✅ Missing data = "Unknown" (never silent pass/fail)
- ✅ Translation memory for verified mappings
- ✅ Hybrid translation: deterministic → memory → RAG → LLM
- ✅ Offline capable

## License

MIT License - See LICENSE file for details