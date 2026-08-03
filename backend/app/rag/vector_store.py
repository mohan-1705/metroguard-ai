import numpy as np
import json
import os
from typing import List, Dict, Any
from app.rag.embeddings import embedder

class SimpleVectorStore:
    def __init__(self):
        self.texts = []
        self.metadata = []
        self.embeddings = []

    def add_texts(self, texts: List[str], metadatas: List[Dict[str, Any]]):
        self.texts.extend(texts)
        self.metadata.extend(metadatas)
        new_embs = embedder.embed(texts)
        self.embeddings.extend(new_embs)

    def similarity_search(self, query: str, k: int = 3) -> List[Dict[str, Any]]:
        if not self.embeddings:
            return []
        
        query_emb = embedder.embed_query(query)
        scores = []
        for idx, emb in enumerate(self.embeddings):
            if len(query_emb) != len(emb):
                # Handle vocabulary mismatch for simple embedder fallback
                all_texts = self.texts + [query]
                from app.rag.embeddings import SimpleTextEmbedder
                if isinstance(embedder, SimpleTextEmbedder):
                    # Recompute temporary matching
                    temp_embedder = SimpleTextEmbedder()
                    temp_embs = temp_embedder.embed(all_texts)
                    temp_query_emb = temp_embs[-1]
                    temp_doc_embs = temp_embs[:-1]
                    val = np.dot(temp_query_emb, temp_doc_embs[idx])
                else:
                    val = 0.0
            else:
                val = np.dot(query_emb, emb)
            scores.append((idx, float(val)))
            
        scores.sort(key=lambda x: x[1], reverse=True)
        results = []
        for idx, score in scores[:k]:
            results.append({
                "text": self.texts[idx],
                "metadata": self.metadata[idx],
                "score": score
            })
        return results

    def save(self, filepath: str):
        data = {
            "texts": self.texts,
            "metadata": self.metadata,
            "embeddings": [e.tolist() for e in self.embeddings]
        }
        dirpath = os.path.dirname(filepath)
        if dirpath:
            os.makedirs(dirpath, exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def load(self, filepath: str):
        if not os.path.exists(filepath):
            return
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.texts = data.get("texts", [])
        self.metadata = data.get("metadata", [])
        self.embeddings = [np.array(e) for e in data.get("embeddings", [])]

vector_store = SimpleVectorStore()
