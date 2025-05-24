"""
Configuration settings for different environments
"""
import os
from datetime import timedelta

class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    
    # Kafka Configuration
    KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
    KAFKA_ALERT_TOPIC = os.getenv('KAFKA_ALERT_TOPIC', 'infrastructure-alerts')
    KAFKA_INFRASTRUCTURE_TOPIC = os.getenv('KAFKA_INFRASTRUCTURE_TOPIC', 'infrastructure-updates')
    KAFKA_ANALYSIS_TOPIC = os.getenv('KAFKA_ANALYSIS_TOPIC', 'infrastructure-analysis')
    KAFKA_PREDICTION_TOPIC = os.getenv('KAFKA_PREDICTION_TOPIC', 'deployment-predictions')
    
    # Database Configuration
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/alert-dashboard')
    NEO4J_URI = os.getenv('NEO4J_URI', 'bolt://localhost:7687')
    NEO4J_USER = os.getenv('NEO4J_USER', 'neo4j')
    NEO4J_PASSWORD = os.getenv('NEO4J_PASSWORD', 'password')
    INFLUXDB_URL = os.getenv('INFLUXDB_URL', 'http://localhost:8086')
    INFLUXDB_TOKEN = os.getenv('INFLUXDB_TOKEN', 'my-token')
    INFLUXDB_ORG = os.getenv('INFLUXDB_ORG', 'my-org')
    INFLUXDB_BUCKET = os.getenv('INFLUXDB_BUCKET', 'alert-metrics')
    
    # API Configuration
    API_TITLE = 'Infrastructure Alert Intelligence Dashboard API'
    API_VERSION = '1.0'
    API_DESCRIPTION = 'API for managing infrastructure alerts and analysis'
    
    # Logging Configuration
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    

class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = False
    TESTING = True
    # Use in-memory or test-specific databases
    MONGODB_URI = 'mongodb://localhost:27017/alert-dashboard-test'
    

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    # Ensure all secrets are loaded from environment variables
    SECRET_KEY = os.getenv('SECRET_KEY')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    # Use more secure token expiration in production
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)
