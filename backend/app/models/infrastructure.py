"""
Infrastructure component models for the application
"""
from datetime import datetime
from enum import Enum
from typing import List, Dict, Optional, Any, Set


class ComponentType(str, Enum):
    """Types of infrastructure components"""
    SERVER = "server"
    DATABASE = "database"
    NETWORK = "network"
    STORAGE = "storage"
    APPLICATION = "application"
    SERVICE = "service"
    CONTAINER = "container"
    LOAD_BALANCER = "load_balancer"
    CACHE = "cache"
    QUEUE = "queue"


class ComponentStatus(str, Enum):
    """Status of infrastructure components"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    WARNING = "warning"
    CRITICAL = "critical"
    UNKNOWN = "unknown"
    MAINTENANCE = "maintenance"


class InfrastructureComponent:
    """Infrastructure component data model"""
    
    def __init__(
        self,
        component_id: str,
        name: str,
        component_type: ComponentType,
        status: ComponentStatus = ComponentStatus.UNKNOWN,
        metadata: Optional[Dict[str, Any]] = None,
        dependencies: Optional[List[str]] = None,
        dependents: Optional[List[str]] = None,
        location: Optional[str] = None,
        owner: Optional[str] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ):
        self.component_id = component_id
        self.name = name
        self.component_type = component_type
        self.status = status
        self.metadata = metadata or {}
        self.dependencies = dependencies or []
        self.dependents = dependents or []
        self.location = location
        self.owner = owner
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()
        self.active_alerts: List[str] = []
    
    def update_status(self, new_status: ComponentStatus):
        """Update component status"""
        self.status = new_status
        self.updated_at = datetime.utcnow()
    
    def add_dependency(self, component_id: str):
        """Add dependency relationship"""
        if component_id not in self.dependencies:
            self.dependencies.append(component_id)
            self.updated_at = datetime.utcnow()
    
    def remove_dependency(self, component_id: str):
        """Remove dependency relationship"""
        if component_id in self.dependencies:
            self.dependencies.remove(component_id)
            self.updated_at = datetime.utcnow()
    
    def add_dependent(self, component_id: str):
        """Add dependent relationship"""
        if component_id not in self.dependents:
            self.dependents.append(component_id)
            self.updated_at = datetime.utcnow()
    
    def remove_dependent(self, component_id: str):
        """Remove dependent relationship"""
        if component_id in self.dependents:
            self.dependents.remove(component_id)
            self.updated_at = datetime.utcnow()
    
    def add_alert(self, alert_id: str):
        """Add active alert to component"""
        if alert_id not in self.active_alerts:
            self.active_alerts.append(alert_id)
            self.updated_at = datetime.utcnow()
    
    def remove_alert(self, alert_id: str):
        """Remove active alert from component"""
        if alert_id in self.active_alerts:
            self.active_alerts.remove(alert_id)
            self.updated_at = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert component to dictionary representation"""
        return {
            "component_id": self.component_id,
            "name": self.name,
            "component_type": self.component_type,
            "status": self.status,
            "metadata": self.metadata,
            "dependencies": self.dependencies,
            "dependents": self.dependents,
            "location": self.location,
            "owner": self.owner,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "active_alerts": self.active_alerts
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'InfrastructureComponent':
        """Create component from dictionary representation"""
        # Convert string timestamps to datetime objects
        created_at = datetime.fromisoformat(data["created_at"]) if "created_at" in data else None
        updated_at = datetime.fromisoformat(data["updated_at"]) if "updated_at" in data else None
        
        # Create component instance
        component = cls(
            component_id=data["component_id"],
            name=data["name"],
            component_type=data["component_type"],
            status=data.get("status", ComponentStatus.UNKNOWN),
            metadata=data.get("metadata", {}),
            dependencies=data.get("dependencies", []),
            dependents=data.get("dependents", []),
            location=data.get("location"),
            owner=data.get("owner"),
            created_at=created_at,
            updated_at=updated_at
        )
        
        # Add active alerts
        component.active_alerts = data.get("active_alerts", [])
        
        return component


class InfrastructureGraph:
    """Graph representation of infrastructure components"""
    
    def __init__(self):
        self.components: Dict[str, InfrastructureComponent] = {}
    
    def add_component(self, component: InfrastructureComponent):
        """Add component to graph"""
        self.components[component.component_id] = component
    
    def remove_component(self, component_id: str):
        """Remove component from graph"""
        if component_id in self.components:
            # Remove relationships in other components
            component = self.components[component_id]
            
            # Remove as dependency from dependents
            for dependent_id in component.dependents:
                if dependent_id in self.components:
                    self.components[dependent_id].remove_dependency(component_id)
            
            # Remove as dependent from dependencies
            for dependency_id in component.dependencies:
                if dependency_id in self.components:
                    self.components[dependency_id].remove_dependent(component_id)
            
            # Remove the component
            del self.components[component_id]
    
    def get_component(self, component_id: str) -> Optional[InfrastructureComponent]:
        """Get component by ID"""
        return self.components.get(component_id)
    
    def add_relationship(self, dependent_id: str, dependency_id: str):
        """Add dependency relationship between components"""
        if dependent_id in self.components and dependency_id in self.components:
            # Add dependency to dependent
            self.components[dependent_id].add_dependency(dependency_id)
            
            # Add dependent to dependency
            self.components[dependency_id].add_dependent(dependent_id)
    
    def remove_relationship(self, dependent_id: str, dependency_id: str):
        """Remove dependency relationship between components"""
        if dependent_id in self.components and dependency_id in self.components:
            # Remove dependency from dependent
            self.components[dependent_id].remove_dependency(dependency_id)
            
            # Remove dependent from dependency
            self.components[dependency_id].remove_dependent(dependent_id)
    
    def get_affected_components(self, source_id: str) -> Set[str]:
        """Get all components affected by an issue in the source component using BFS"""
        if source_id not in self.components:
            return set()
        
        affected = set([source_id])
        queue = [source_id]
        visited = set(queue)
        
        while queue:
            current_id = queue.pop(0)
            current = self.components[current_id]
            
            # Add all dependents to affected and queue
            for dependent_id in current.dependents:
                if dependent_id not in visited and dependent_id in self.components:
                    affected.add(dependent_id)
                    queue.append(dependent_id)
                    visited.add(dependent_id)
        
        return affected
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert graph to dictionary representation"""
        return {
            "components": {
                component_id: component.to_dict()
                for component_id, component in self.components.items()
            }
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'InfrastructureGraph':
        """Create graph from dictionary representation"""
        graph = cls()
        
        if "components" in data:
            for component_id, component_data in data["components"].items():
                component = InfrastructureComponent.from_dict(component_data)
                graph.add_component(component)
        
        return graph
