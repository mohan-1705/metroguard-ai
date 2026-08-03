from fastapi import APIRouter, Depends, Query, HTTPException
from app.rag.retriever import retrieve_evidence
from app.rag.ingest import ingest_knowledge
from pathlib import Path
import glob
import os
import datetime

router = APIRouter()

@router.get("/knowledge/documents")
def get_documents():
    kb_path = Path(__file__).resolve().parent.parent.parent / "knowledge"
    if not kb_path.exists():
        os.makedirs(kb_path, exist_ok=True)
        
    files = glob.glob(os.path.join(str(kb_path), "*.txt"))
    docs = []
    for f in files:
        basename = os.path.basename(f)
        doc_name = basename.replace("_demo.txt", "").replace(".txt", "").replace("_", " ").title()
        
        # Read lines to estimate length
        try:
            with open(f, "r", encoding="utf-8") as file:
                lines = file.readlines()
            pages = max(1, len(lines) // 10)
        except Exception:
            pages = 1
            
        mtime = os.path.getmtime(f) if os.path.exists(f) else datetime.datetime.utcnow().timestamp()
        dt_str = datetime.datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M:%S")
            
        docs.append({
            "name": doc_name,
            "filename": basename,
            "version": "1.0",
            "pages": pages,
            "status": "Indexed",
            "last_updated": dt_str
        })
    return docs

@router.post("/knowledge/ingest")
def post_ingest():
    try:
        ingest_knowledge()
        return {"success": True, "message": "Knowledge ingestion finished successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failure: {str(e)}")

@router.get("/knowledge/search")
def get_search(q: str = Query(..., description="Query text string")):
    return retrieve_evidence(q, k=5)
