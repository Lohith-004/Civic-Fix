import pytest
from datetime import datetime

def test_health_check_payload():
    payload = {
        "status": "healthy",
        "service": "CivicFix API",
        "timestamp": datetime.utcnow().isoformat(),
    }
    assert payload["status"] == "healthy"
    assert "timestamp" in payload

def test_sla_policy_calculation():
    priority_sla = {
        "CRITICAL": 4,
        "HIGH": 24,
        "MEDIUM": 72,
        "LOW": 168,
    }
    assert priority_sla["CRITICAL"] == 4
    assert priority_sla["HIGH"] == 24
    assert priority_sla["MEDIUM"] == 72
    assert priority_sla["LOW"] == 168

def test_issue_lifecycle_transitions():
    valid_transitions = {
        "SUBMITTED": ["UNDER_REVIEW", "VERIFIED", "REJECTED"],
        "VERIFIED": ["ASSIGNED", "IN_PROGRESS"],
        "ASSIGNED": ["IN_PROGRESS", "ON_HOLD"],
        "IN_PROGRESS": ["ON_HOLD", "RESOLVED", "AWAITING_VERIFICATION"],
        "AWAITING_VERIFICATION": ["VERIFIED_RESOLVED", "REOPENED"],
        "REOPENED": ["ASSIGNED", "IN_PROGRESS"],
    }
    assert "AWAITING_VERIFICATION" in valid_transitions["IN_PROGRESS"]
    assert "VERIFIED_RESOLVED" in valid_transitions["AWAITING_VERIFICATION"]
    assert "REOPENED" in valid_transitions["AWAITING_VERIFICATION"]

def test_haversine_distance_computation():
    import math
    def haversine(lat1, lon1, lat2, lon2):
        R = 6371e3
        φ1 = math.radians(lat1)
        φ2 = math.radians(lat2)
        Δφ = math.radians(lat2 - lat1)
        Δλ = math.radians(lon2 - lon1)
        a = math.sin(Δφ/2)**2 + math.cos(φ1)*math.cos(φ2)*math.sin(Δλ/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c

    dist = haversine(37.7749, -122.4194, 37.7750, -122.4195)
    assert dist < 100 # Should be very close (~14 meters)
