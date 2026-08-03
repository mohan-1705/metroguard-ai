from typing import List, Dict, Any
from app.rag.vector_store import vector_store
from app.core.config import settings
import os

def retrieve_evidence(query: str, k: int = None) -> List[Dict[str, Any]]:
    if k is None:
        k = settings.TOP_K
    
    filepath = settings.FAISS_INDEX_PATH + ".json"
    if os.path.exists(filepath):
        vector_store.load(filepath)
    return vector_store.similarity_search(query, k=k)
