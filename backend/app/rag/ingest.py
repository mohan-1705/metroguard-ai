import os
import glob
from typing import List
from app.rag.vector_store import vector_store
from app.core.config import settings

def chunk_text(text: str, chunk_size: int = 500) -> List[str]:
    words = text.split()
    chunks = []
    current_chunk = []
    current_length = 0
    for w in words:
        current_chunk.append(w)
        current_length += len(w) + 1
        if current_length >= chunk_size:
            chunks.append(" ".join(current_chunk))
            current_chunk = current_chunk[len(current_chunk)//2:]  # 50% overlap
            current_length = sum(len(x)+1 for x in current_chunk)
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    return chunks

def ingest_knowledge():
    # Path to the knowledge folder
    kb_path = Path(__file__).resolve().parent.parent.parent / "knowledge"
    if not kb_path.exists():
        os.makedirs(kb_path, exist_ok=True)
        
    files = glob.glob(os.path.join(str(kb_path), "*.txt"))
    
    texts = []
    metadatas = []
    
    for f in files:
        basename = os.path.basename(f)
        doc_name = basename.replace("_demo.txt", "").replace(".txt", "").replace("_", " ").title()
        
        with open(f, "r", encoding="utf-8") as file:
            content = file.read()
            
        chunks = chunk_text(content, settings.CHUNK_SIZE)
        for idx, chunk in enumerate(chunks):
            texts.append(chunk)
            metadatas.append({
                "source": basename,
                "document_name": doc_name,
                "chunk_id": idx,
                "section": f"SOP Section {idx + 1}"
            })
            
    if texts:
        vector_store.add_texts(texts, metadatas)
        filepath = settings.FAISS_INDEX_PATH + ".json"
        vector_store.save(filepath)
        print(f"Successfully ingested {len(texts)} chunks from {len(files)} files. Index saved to {filepath}.")
    else:
        print(f"No files found in {kb_path} to ingest.")

if __name__ == "__main__":
    from pathlib import Path
    ingest_knowledge()
else:
    from pathlib import Path
