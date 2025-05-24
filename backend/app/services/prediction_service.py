"""
Integration of deployment risk prediction service with API endpoints
"""
from flask import request, current_app
from app.services.deployment_predictor import DeploymentRiskPredictor
from datetime import datetime
import os
import json

# Initialize predictor with mock data
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
os.makedirs(MODEL_DIR, exist_ok=True)
MODEL_PATH = os.path.join(MODEL_DIR, 'deployment_risk_model.joblib')

# Singleton instance
_predictor = None

def get_predictor():
    """Get or create the deployment risk predictor singleton"""
    global _predictor
    if _predictor is None:
        _predictor = DeploymentRiskPredictor()
        
        # Train with mock data if model doesn't exist
        if not os.path.exists(MODEL_PATH):
            _predictor.train_with_mock_data(num_samples=1000, model_path=MODEL_PATH)
        else:
            # Load existing model
            _predictor = DeploymentRiskPredictor(model_path=MODEL_PATH)
    
    return _predictor

def predict_deployment_risk(deployment_data):
    """
    Predict risk for a planned deployment
    
    Args:
        deployment_data: Dictionary with deployment information
        
    Returns:
        Dict: Risk prediction results
    """
    # Get predictor
    predictor = get_predictor()
    
    # Enrich deployment data with historical metrics
    enriched_data = enrich_deployment_data(deployment_data)
    
    # Predict risk
    result = predictor.predict_risk(enriched_data)
    
    # Publish prediction to Kafka
    kafka_service = get_kafka_service()
    if kafka_service:
        kafka_service.publish_message(
            topic=current_app.config['KAFKA_PREDICTION_TOPIC'],
            key=deployment_data.get('deployment_id', 'unknown'),
            value=result
        )
    
    return result

def enrich_deployment_data(deployment_data):
    """
    Enrich deployment data with historical metrics
    
    Args:
        deployment_data: Dictionary with deployment information
        
    Returns:
        Dict: Enriched deployment data
    """
    # In a real implementation, this would fetch historical data from database
    # For now, add mock historical metrics
    
    components = deployment_data.get('components', [])
    
    # Mock historical metrics
    enriched_data = deployment_data.copy()
    enriched_data.update({
        'alert_count_7d': len(components) * 2,  # Mock: 2 alerts per component in past week
        'alert_count_30d': len(components) * 5,  # Mock: 5 alerts per component in past month
        'deployment_count_7d': 2,  # Mock: 2 deployments in past week
        'deployment_count_30d': 8,  # Mock: 8 deployments in past month
        'failure_rate_30d': 0.15,  # Mock: 15% failure rate in past month
        'avg_resolution_time': 60,  # Mock: 60 minutes average resolution time
        'component_criticality': calculate_component_criticality(components)
    })
    
    return enriched_data

def calculate_component_criticality(components):
    """
    Calculate criticality score for components
    
    Args:
        components: List of component IDs
        
    Returns:
        float: Criticality score (0-1)
    """
    # In a real implementation, this would calculate based on component metadata
    # For now, use mock criticality based on component type
    
    # Get components from database
    all_components = get_components_from_db()
    
    # Calculate criticality score
    total_score = 0.0
    count = 0
    
    for comp_id in components:
        if comp_id in all_components:
            component = all_components[comp_id]
            
            # Assign criticality based on component type
            if component.component_type == "database":
                score = 0.9
            elif component.component_type == "server":
                score = 0.7
            elif component.component_type == "application":
                score = 0.6
            elif component.component_type == "service":
                score = 0.8
            else:
                score = 0.5
            
            # Adjust based on status
            if component.status == "critical":
                score += 0.1
            elif component.status == "warning":
                score += 0.05
            
            total_score += score
            count += 1
    
    # Return average criticality, default to medium (0.5) if no components found
    return total_score / count if count > 0 else 0.5

def get_optimal_deployment_windows():
    """
    Get recommended deployment windows for the next 7 days
    
    Returns:
        Dict: Optimal deployment windows by day
    """
    # In a real implementation, this would use the predictor to analyze
    # different time slots and return the optimal ones
    
    # For now, return mock data
    windows = {
        'Monday': [
            {'time': '10:00-12:00', 'risk_level': 'low'},
            {'time': '14:00-16:00', 'risk_level': 'low'}
        ],
        'Tuesday': [
            {'time': '10:00-12:00', 'risk_level': 'low'},
            {'time': '14:00-16:00', 'risk_level': 'medium'}
        ],
        'Wednesday': [
            {'time': '10:00-12:00', 'risk_level': 'medium'},
            {'time': '14:00-16:00', 'risk_level': 'low'}
        ],
        'Thursday': [
            {'time': '10:00-12:00', 'risk_level': 'low'},
            {'time': '14:00-16:00', 'risk_level': 'low'}
        ],
        'Friday': [
            {'time': '10:00-12:00', 'risk_level': 'medium'},
            {'time': '14:00-16:00', 'risk_level': 'high'}
        ],
        'Saturday': [
            {'time': '10:00-12:00', 'risk_level': 'high'},
            {'time': '14:00-16:00', 'risk_level': 'high'}
        ],
        'Sunday': [
            {'time': '10:00-12:00', 'risk_level': 'high'},
            {'time': '14:00-16:00', 'risk_level': 'high'}
        ]
    }
    
    return windows

def get_components_from_db():
    """
    Get infrastructure components from database
    In a real implementation, this would fetch from a database
    For now, return mock data
    """
    # Import here to avoid circular imports
    from app.services.analysis_service import get_components_from_db as get_components
    return get_components()

def get_kafka_service():
    """Get Kafka service if available"""
    try:
        from app.services.kafka_service import get_kafka_service
        return get_kafka_service()
    except:
        return None
