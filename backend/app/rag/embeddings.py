import numpy as np
import re
from typing import List

class SimpleTextEmbedder:
    def __init__(self):
        self.vocab = {}

    def _get_words(self, text: str) -> List[str]:
        return re.findall(r"\w+", text.lower())

    def embed(self, texts: List[str]) -> List[np.ndarray]:
        if not self.vocab:
            all_words = []
            for t in texts:
                all_words.extend(self._get_words(t))
            unique_words = sorted(list(set(all_words)))
            self.vocab = {word: idx for idx, word in enumerate(unique_words)}
        
        embeddings = []
        for text in texts:
            vec = np.zeros(max(len(self.vocab), 1))
            words = self._get_words(text)
            for w in words:
                if w in self.vocab:
                    vec[self.vocab[w]] += 1
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            embeddings.append(vec)
        return embeddings

    def embed_query(self, query: str) -> np.ndarray:
        vec = np.zeros(max(len(self.vocab), 1))
        words = self._get_words(query)
        for w in words:
            if w in self.vocab:
                vec[self.vocab[w]] += 1
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

try:
    from sentence_transformers import SentenceTransformer
    class HuggingFaceEmbedder:
        def __init__(self):
            # Using a very small model
            self.model = SentenceTransformer("all-MiniLM-L6-v2")
            
        def embed(self, texts: List[str]) -> List[np.ndarray]:
            return [np.array(v) for v in self.model.encode(texts)]
            
        def embed_query(self, query: str) -> np.ndarray:
            return np.array(self.model.encode(query))
            
    embedder = HuggingFaceEmbedder()
except Exception:
    # Fallback to SimpleTextEmbedder if packages or download fails
    embedder = SimpleTextEmbedder()
