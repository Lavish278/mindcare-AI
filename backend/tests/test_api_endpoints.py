import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "MindCare" in data["app"]


def test_auth_registration_and_me():
    reg_payload = {
        "email": "test-student@mindcare.edu",
        "password": "SecurePassword123!",
        "display_name": "Jordan Taylor"
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 200
    data = res.json()
    token = data["access_token"]
    assert token is not None

    # Test /me with token
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "test-student@mindcare.edu"


def test_chat_endpoint_normal_and_crisis():
    # 1. Normal conversational message
    normal_res = client.post(
        "/api/v1/chat/message",
        json={"message": "I'm feeling a bit anxious about my exams next week.", "current_mode": "AWAKE"}
    )
    assert normal_res.status_code == 200
    normal_data = normal_res.json()
    assert normal_data["safety_interception"] is False
    assert len(normal_data["message"]) > 20
    assert len(normal_data["suggested_followups"]) > 0

    # 2. Crisis trigger message MUST trigger immediate safety interception
    crisis_res = client.post(
        "/api/v1/chat/message",
        json={"message": "I want to end my life, I cannot take it", "current_mode": "AWAKE"}
    )
    assert crisis_res.status_code == 200
    crisis_data = crisis_res.json()
    assert crisis_data["safety_interception"] is True
    assert crisis_data["safety_details"] is not None
    assert "988" in str(crisis_data["safety_details"])


def test_checkin_flow():
    # Adaptive questions
    q_res = client.get("/api/v1/checkins/questions?check_in_type=midday")
    assert q_res.status_code == 200
    assert len(q_res.json()["questions"]) >= 3

    # Submit check-in
    sub_res = client.post("/api/v1/checkins/submit", json={
        "check_in_type": "midday",
        "mood_score": 7,
        "stress_score": 5,
        "energy_score": 6,
        "notes": "Testing midday check-in via API test."
    })
    assert sub_res.status_code == 200
    assert sub_res.json()["status"] == "success"

    # Indicators
    ind_res = client.get("/api/v1/checkins/indicators")
    assert ind_res.status_code == 200
    assert "WELLNESS INDICATORS" in ind_res.json()["disclaimer"]


def test_wearable_endpoints():
    # Status
    st_res = client.get("/api/v1/wearables/status")
    assert st_res.status_code == 200

    # Mode
    m_res = client.post("/api/v1/wearables/mode", json={"mode": "SLEEP", "manual_override": True})
    assert m_res.status_code == 200
    assert m_res.json()["mode"] == "SLEEP"

    # Simulate Anomaly
    sim_res = client.post("/api/v1/wearables/simulate-anomaly", json={"anomaly_scenario": "sleep_high_hr"})
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert sim_data["anomaly_evaluation"]["is_anomaly"] is True

    # Simulate Exercise spike (should NOT be anomaly)
    sim_ex_res = client.post("/api/v1/wearables/simulate-anomaly", json={"anomaly_scenario": "exercise_normal_spike"})
    assert sim_ex_res.status_code == 200
    assert sim_ex_res.json()["anomaly_evaluation"]["is_anomaly"] is False


def test_progress_and_admin_endpoints():
    prog_res = client.get("/api/v1/progress/summary")
    assert prog_res.status_code == 200
    prog_data = prog_res.json()
    assert "weekly_metrics" in prog_data
    assert len(prog_data["daily_trends"]) == 7

    admin_res = client.get("/api/v1/admin/metrics")
    assert admin_res.status_code == 200
    admin_data = admin_res.json()
    assert admin_data["active_cohort_size"] >= 40
    assert "continuous_improvement_pipeline" in admin_data
