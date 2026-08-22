"""
retrieval/embeddings.py — MiniLM-L12-v2 embedding wrapper.
Stores/loads 384-dim float32 BLOBs in SQLite.
Lazy-loads the model on first use to keep startup fast.
"""
import struct
import numpy as np
from typing import Optional

_model = None


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("sentence-transformers/all-MiniLM-L12-v2")
    return _model


def embed(text: str) -> np.ndarray:
    """Return a 384-dim float32 numpy array."""
    model = _get_model()
    vec = model.encode(text, normalize_embeddings=True)
    return vec.astype(np.float32)


def to_blob(vec: np.ndarray) -> bytes:
    """Pack float32 array → bytes for SQLite BLOB."""
    return struct.pack(f"{len(vec)}f", *vec)


def from_blob(blob: bytes) -> np.ndarray:
    """Unpack BLOB → float32 numpy array."""
    n = len(blob) // 4
    return np.array(struct.unpack(f"{n}f", blob), dtype=np.float32)


def cosine(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity (both assumed normalized)."""
    dot = float(np.dot(a, b))
    return max(0.0, min(1.0, dot))
