"""
Alert models for the application
"""
from datetime import datetime
from enum import Enum
from typing import List, Dict, Optional, Any


class AlertSeverity(str, Enum):
    """Alert severity levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class AlertStatus(str, Enum):
    """Alert status states"""
    NEW = "new"
    ACKNOWLEDGED = "acknowledged"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class Alert:
    """Alert data model"""
    
    def __init__(
        self,
        alert_id: str,
        timestamp: datetime,
        source_component: str,
        alert_type: str,
        severity: AlertSeverity,
        description: str,
        status: AlertStatus = AlertStatus.NEW,
        affected_components: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        assigned_to: Optional[str] = None,
        resolution_time: Optional[datetime] = None,
        resolution_notes: Optional[str] = None
    ):
        self.alert_id = alert_id
        self.timestamp = timestamp
        self.source_component = source_component
        self.alert_type = alert_type
        self.severity = severity
        self.description = description
        self.status = status
        self.affected_components = affected_components or []
        self.metadata = metadata or {}
        self.assigned_to = assigned_to
        self.resolution_time = resolution_time
        self.resolution_notes = resolution_notes
        self.update_history = []
    
    def update_status(self, new_status: AlertStatus, updated_by: str, notes: Optional[str] = None):
        """Update alert status and record in history"""
        old_status = self.status
        self.status = new_status
        
        update = {
            "timestamp": datetime.utcnow(),
            "field": "status",
            "old_value": old_status,
            "new_value": new_status,
            "updated_by": updated_by,
            "notes": notes
        }
        
        self.update_history.append(update)
        
        if new_status == AlertStatus.RESOLVED and not self.resolution_time:
            self.resolution_time = datetime.utcnow()
            self.resolution_notes = notes
    
    def add_affected_component(self, component_id: str):
        """Add component to affected components list"""
        if component_id not in self.affected_components:
            self.affected_components.append(component_id)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert alert to dictionary representation"""
        return {
            "alert_id": self.alert_id,
            "timestamp": self.timestamp.isoformat(),
            "source_component": self.source_component,
            "alert_type": self.alert_type,
            "severity": self.severity,
            "description": self.description,
            "status": self.status,
            "affected_components": self.affected_components,
            "metadata": self.metadata,
            "assigned_to": self.assigned_to,
            "resolution_time": self.resolution_time.isoformat() if self.resolution_time else None,
            "resolution_notes": self.resolution_notes,
            "update_history": [
                {
                    **update,
                    "timestamp": update["timestamp"].isoformat()
                }
                for update in self.update_history
            ]
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Alert':
        """Create alert from dictionary representation"""
        # Convert string timestamps to datetime objects
        timestamp = datetime.fromisoformat(data["timestamp"])
        resolution_time = datetime.fromisoformat(data["resolution_time"]) if data.get("resolution_time") else None
        
        # Create alert instance
        alert = cls(
            alert_id=data["alert_id"],
            timestamp=timestamp,
            source_component=data["source_component"],
            alert_type=data["alert_type"],
            severity=data["severity"],
            description=data["description"],
            status=data["status"],
            affected_components=data.get("affected_components", []),
            metadata=data.get("metadata", {}),
            assigned_to=data.get("assigned_to"),
            resolution_time=resolution_time,
            resolution_notes=data.get("resolution_notes")
        )
        
        # Restore update history
        if "update_history" in data:
            alert.update_history = [
                {
                    **update,
                    "timestamp": datetime.fromisoformat(update["timestamp"])
                }
                for update in data["update_history"]
            ]
        
        return alert
