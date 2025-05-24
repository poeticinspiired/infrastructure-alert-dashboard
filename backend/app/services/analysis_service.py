"""
Integration of graph analysis service with API endpoints
"""
from flask import request, current_app
from app.services.graph_analysis import GraphAnalysis
from app.models.infrastructure import InfrastructureComponent
from datetime import datetime
import json

def get_components_from_db():
    """
    Get infrastructure components from database
    In a real implementation, this would fetch from a database
    For now, return mock data
    """
    # Mock components data
    components = {
        "server-001": InfrastructureComponent(
            component_id="server-001",
            name="Web Server 1",
            component_type="server",
            status="healthy",
            dependencies=[],
            dependents=["app-001", "app-002"]
        ),
        "db-001": InfrastructureComponent(
            component_id="db-001",
            name="Primary Database",
            component_type="database",
            status="healthy",
            dependencies=[],
            dependents=["app-001", "app-003"]
        ),
        "app-001": InfrastructureComponent(
            component_id="app-001",
            name="User Service",
            component_type="application",
            status="degraded",
            dependencies=["server-001", "db-001"],
            dependents=["service-001"]
        ),
        "app-002": InfrastructureComponent(
            component_id="app-002",
            name="Order Service",
            component_type="application",
            status="warning",
            dependencies=["server-001"],
            dependents=["service-001"]
        ),
        "app-003": InfrastructureComponent(
            component_id="app-003",
            name="Inventory Service",
            component_type="application",
            status="healthy",
            dependencies=["db-001"],
            dependents=["service-001"]
        ),
        "service-001": InfrastructureComponent(
            component_id="service-001",
            name="API Gateway",
            component_type="service",
            status="healthy",
            dependencies=["app-001", "app-002", "app-003"],
            dependents=[]
        )
    }
    
    return components

def analyze_impact(component_id):
    """
    Analyze impact of an issue in the source component using BFS
    
    Args:
        component_id: ID of the source component
        
    Returns:
        Dict: Analysis result
    """
    # Get components from database
    components = get_components_from_db()
    
    # Perform BFS impact analysis
    result = GraphAnalysis.bfs_impact_analysis(components, component_id)
    
    # Publish analysis result to Kafka
    kafka_service = get_kafka_service()
    if kafka_service:
        kafka_service.publish_message(
            topic=current_app.config['KAFKA_ANALYSIS_TOPIC'],
            key=component_id,
            value=result
        )
    
    return result

def analyze_failure_domains(component_ids):
    """
    Identify connected failure domains using Union-Find algorithm
    
    Args:
        component_ids: List of component IDs to analyze
        
    Returns:
        Dict: Analysis result
    """
    # Get components from database
    components = get_components_from_db()
    
    # Perform Union-Find analysis
    result = GraphAnalysis.union_find_analysis(components, component_ids)
    
    # Publish analysis result to Kafka
    kafka_service = get_kafka_service()
    if kafka_service:
        kafka_service.publish_message(
            topic=current_app.config['KAFKA_ANALYSIS_TOPIC'],
            key='failure-domains',
            value=result
        )
    
    return result

def analyze_health_status():
    """
    Analyze overall infrastructure health status
    
    Returns:
        Dict: Analysis result
    """
    # Get components from database
    components = get_components_from_db()
    
    # Perform health status analysis
    result = GraphAnalysis.health_status_analysis(components)
    
    # Publish analysis result to Kafka
    kafka_service = get_kafka_service()
    if kafka_service:
        kafka_service.publish_message(
            topic=current_app.config['KAFKA_ANALYSIS_TOPIC'],
            key='health-status',
            value=result
        )
    
    return result

def get_kafka_service():
    """Get Kafka service if available"""
    try:
        from app.services.kafka_service import get_kafka_service
        return get_kafka_service()
    except:
        return None
