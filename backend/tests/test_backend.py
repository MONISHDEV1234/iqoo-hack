import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from db import init_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    """Ensure database schema is ready before running tests."""
    init_db()

def test_dashboard_stats():
    response = client.get("/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_experiences" in data
    assert "total_recalls" in data
    assert "total_sessions" in data
    assert "experiences_by_scope" in data
    assert "experiences_by_category" in data

def test_create_and_get_experience():
    payload = {
        "title": "PyTest Test Experience",
        "problem_summary": "Test error in FastAPI pytest suite",
        "category": "testing",
        "scope": "project",
        "error_codes": ["ERR_TEST_101"],
        "symptoms": ["assertion failure"],
        "failed_approaches": ["Ignoring error"],
        "successful_approach": "Add proper assertions",
        "root_cause": "Missing verification",
        "lesson": "Always test FastAPI endpoints with TestClient",
        "confidence": 0.95
    }
    create_res = client.post("/experiences", json=payload)
    assert create_res.status_code == 201
    created_data = create_res.json()
    assert created_data["id"] > 0
    assert created_data["problem_summary"] == payload["problem_summary"]

    exp_id = created_data["id"]
    get_res = client.get(f"/experiences/{exp_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == exp_id

def test_list_experiences():
    res = client.get("/experiences?limit=10")
    assert res.status_code == 200
    items = res.json()
    assert isinstance(items, list)

def test_session_extract():
    sample_text = """
    [2026-08-25 12:00:00] pytest tests/test_api.py
    FAILED tests/test_api.py::test_login - KeyError: 'access_token'
    [2026-08-25 12:01:00] File saved app/auth.py
    [2026-08-25 12:02:00] pytest tests/test_api.py
    PASSED
    """
    res = client.post("/session/extract", json={"raw_text": sample_text, "project": "test-project"})
    assert res.status_code == 200
    data = res.json()
    assert "experience" in data
    assert data["experience"]["problem_summary"] != ""

def test_retrieve_experiences():
    res = client.post("/retrieve", json={"problem_text": "KeyError access_token in auth pytest"})
    assert res.status_code == 200
    data = res.json()
    assert "results" in data
    assert "count" in data

def test_generate_report():
    res = client.post("/report", json={"current_problem": "KeyError access_token"})
    assert res.status_code == 200
    data = res.json()
    assert "report" in data
    assert "<MISTAKEMEMO_REPORT>" in data["report"]

def test_llm_ask():
    res_without = client.post("/llm/ask", json={"problem_text": "FastAPI KeyError", "mode": "without_memory"})
    assert res_without.status_code == 200
    assert res_without.json()["mode"] == "without_memory"

    res_with = client.post("/llm/ask", json={"problem_text": "FastAPI KeyError", "report_text": "Some report", "mode": "with_memory"})
    assert res_with.status_code == 200
    assert res_with.json()["mode"] == "with_memory"

def test_chat_patterns():
    res = client.get("/chat/patterns")
    assert res.status_code == 200
    data = res.json()
    assert "top_categories" in data
