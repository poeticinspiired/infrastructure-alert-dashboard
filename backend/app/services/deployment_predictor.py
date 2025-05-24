import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from datetime import datetime, timedelta
import joblib
import os
from typing import Dict, List, Any, Tuple, Optional

class DeploymentRiskPredictor:
    """
    Machine learning model for predicting deployment risks
    """
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize the deployment risk predictor
        
        Args:
            model_path: Path to saved model file (if None, a new model will be created)
        """
        self.model = None
        self.feature_pipeline = None
        
        if model_path and os.path.exists(model_path):
            self._load_model(model_path)
        else:
            self._create_model()
    
    def _create_model(self):
        """Create a new risk prediction model"""
        # Define feature preprocessing
        numeric_features = ['component_count', 'alert_count_7d', 'alert_count_30d', 
                           'deployment_count_7d', 'deployment_count_30d', 'failure_rate_30d',
                           'avg_resolution_time', 'component_criticality']
        
        categorical_features = ['day_of_week', 'time_of_day', 'deployment_type']
        
        numeric_transformer = Pipeline(steps=[
            ('scaler', StandardScaler())
        ])
        
        categorical_transformer = Pipeline(steps=[
            ('onehot', OneHotEncoder(handle_unknown='ignore'))
        ])
        
        self.feature_pipeline = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_features),
                ('cat', categorical_transformer, categorical_features)
            ])
        
        # Create risk score prediction model (regression)
        risk_model = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        
        # Create full pipeline
        self.model = Pipeline(steps=[
            ('preprocessor', self.feature_pipeline),
            ('regressor', risk_model)
        ])
    
    def _load_model(self, model_path: str):
        """
        Load model from file
        
        Args:
            model_path: Path to saved model file
        """
        loaded_model = joblib.load(model_path)
        self.model = loaded_model
        
        # Extract feature pipeline from loaded model
        self.feature_pipeline = self.model.named_steps['preprocessor']
    
    def save_model(self, model_path: str):
        """
        Save model to file
        
        Args:
            model_path: Path to save model file
        """
        if self.model:
            joblib.dump(self.model, model_path)
    
    def train(self, training_data: pd.DataFrame):
        """
        Train the risk prediction model
        
        Args:
            training_data: DataFrame with historical deployment data
        """
        if training_data.empty:
            raise ValueError("Training data is empty")
        
        # Ensure required columns exist
        required_columns = ['component_count', 'alert_count_7d', 'alert_count_30d', 
                           'deployment_count_7d', 'deployment_count_30d', 'failure_rate_30d',
                           'avg_resolution_time', 'component_criticality',
                           'day_of_week', 'time_of_day', 'deployment_type', 'risk_score']
        
        missing_columns = [col for col in required_columns if col not in training_data.columns]
        if missing_columns:
            raise ValueError(f"Training data missing required columns: {missing_columns}")
        
        # Split features and target
        X = training_data.drop('risk_score', axis=1)
        y = training_data['risk_score']
        
        # Train model
        self.model.fit(X, y)
    
    def predict_risk(self, deployment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict risk for a planned deployment
        
        Args:
            deployment_data: Dictionary with deployment information
            
        Returns:
            Dict: Risk prediction results
        """
        if not self.model:
            raise ValueError("Model not trained or loaded")
        
        # Extract features from deployment data
        features = self._extract_features(deployment_data)
        
        # Convert to DataFrame
        df = pd.DataFrame([features])
        
        # Predict risk score
        risk_score = float(self.model.predict(df)[0])
        
        # Clamp risk score between 0 and 1
        risk_score = max(0.0, min(1.0, risk_score))
        
        # Generate risk factors based on feature importance and values
        risk_factors = self._generate_risk_factors(features, risk_score)
        
        # Generate recommended actions
        recommended_actions = self._generate_recommendations(features, risk_score, risk_factors)
        
        # Determine optimal deployment window
        optimal_window = self._determine_optimal_window(features, risk_score)
        
        return {
            'deployment_id': deployment_data.get('deployment_id', 'unknown'),
            'components': deployment_data.get('components', []),
            'risk_score': round(risk_score, 2),
            'risk_factors': risk_factors,
            'recommended_actions': recommended_actions,
            'optimal_window': optimal_window,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def _extract_features(self, deployment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract features from deployment data
        
        Args:
            deployment_data: Dictionary with deployment information
            
        Returns:
            Dict: Features for prediction
        """
        # Extract or default features
        features = {
            'component_count': len(deployment_data.get('components', [])),
            'alert_count_7d': deployment_data.get('alert_count_7d', 0),
            'alert_count_30d': deployment_data.get('alert_count_30d', 0),
            'deployment_count_7d': deployment_data.get('deployment_count_7d', 0),
            'deployment_count_30d': deployment_data.get('deployment_count_30d', 0),
            'failure_rate_30d': deployment_data.get('failure_rate_30d', 0.0),
            'avg_resolution_time': deployment_data.get('avg_resolution_time', 0.0),
            'component_criticality': deployment_data.get('component_criticality', 0.5),
        }
        
        # Extract planned time or use current time
        planned_time = deployment_data.get('planned_time')
        if planned_time:
            if isinstance(planned_time, str):
                planned_time = datetime.fromisoformat(planned_time)
        else:
            planned_time = datetime.utcnow()
        
        # Extract day of week and time of day
        features['day_of_week'] = planned_time.strftime('%A')
        
        hour = planned_time.hour
        if 6 <= hour < 12:
            time_of_day = 'morning'
        elif 12 <= hour < 18:
            time_of_day = 'afternoon'
        elif 18 <= hour < 22:
            time_of_day = 'evening'
        else:
            time_of_day = 'night'
        
        features['time_of_day'] = time_of_day
        
        # Extract deployment type
        features['deployment_type'] = deployment_data.get('deployment_type', 'regular')
        
        return features
    
    def _generate_risk_factors(self, features: Dict[str, Any], risk_score: float) -> List[str]:
        """
        Generate risk factors based on features and risk score
        
        Args:
            features: Dictionary of features
            risk_score: Predicted risk score
            
        Returns:
            List[str]: Risk factors
        """
        risk_factors = []
        
        # High component count
        if features['component_count'] > 5:
            risk_factors.append(f"Large deployment affecting {features['component_count']} components")
        
        # Recent alerts
        if features['alert_count_7d'] > 10:
            risk_factors.append(f"High number of recent alerts ({features['alert_count_7d']} in past week)")
        
        # Recent deployments
        if features['deployment_count_7d'] > 3:
            risk_factors.append(f"Multiple recent deployments ({features['deployment_count_7d']} in past week)")
        
        # High failure rate
        if features['failure_rate_30d'] > 0.2:
            failure_percent = int(features['failure_rate_30d'] * 100)
            risk_factors.append(f"High historical failure rate ({failure_percent}% in past month)")
        
        # Long resolution time
        if features['avg_resolution_time'] > 120:
            hours = int(features['avg_resolution_time'] / 60)
            risk_factors.append(f"Long average incident resolution time ({hours}+ hours)")
        
        # Critical components
        if features['component_criticality'] > 0.7:
            risk_factors.append("Deployment affects critical infrastructure components")
        
        # Time-based risks
        if features['day_of_week'] in ['Saturday', 'Sunday']:
            risk_factors.append("Weekend deployment")
        
        if features['time_of_day'] in ['evening', 'night']:
            risk_factors.append("After-hours deployment")
        
        # If no specific factors but high risk
        if not risk_factors and risk_score > 0.5:
            risk_factors.append("Multiple combined risk factors")
        
        return risk_factors
    
    def _generate_recommendations(
        self, 
        features: Dict[str, Any], 
        risk_score: float,
        risk_factors: List[str]
    ) -> List[str]:
        """
        Generate recommended actions based on features and risk score
        
        Args:
            features: Dictionary of features
            risk_score: Predicted risk score
            risk_factors: List of identified risk factors
            
        Returns:
            List[str]: Recommended actions
        """
        recommendations = []
        
        # High component count recommendations
        if features['component_count'] > 5:
            recommendations.append("Break deployment into smaller batches")
            recommendations.append("Deploy components sequentially rather than simultaneously")
        
        # Recent alerts recommendations
        if features['alert_count_7d'] > 10:
            recommendations.append("Resolve existing alerts before deployment")
            recommendations.append("Increase monitoring during and after deployment")
        
        # Time-based recommendations
        if features['day_of_week'] in ['Saturday', 'Sunday'] or features['time_of_day'] in ['evening', 'night']:
            recommendations.append("Reschedule deployment during business hours")
            recommendations.append("Ensure on-call staff availability during deployment")
        
        # High failure rate recommendations
        if features['failure_rate_30d'] > 0.2:
            recommendations.append("Perform additional pre-deployment testing")
            recommendations.append("Prepare detailed rollback plan")
        
        # Critical component recommendations
        if features['component_criticality'] > 0.7:
            recommendations.append("Implement canary deployment approach")
            recommendations.append("Schedule additional verification steps post-deployment")
        
        # General recommendations based on risk score
        if risk_score > 0.7:
            recommendations.append("Consider postponing deployment until risk factors are mitigated")
        elif risk_score > 0.4:
            recommendations.append("Allocate additional engineering resources during deployment")
        
        # Always recommend monitoring
        if "Increase monitoring during and after deployment" not in recommendations:
            recommendations.append("Monitor system health metrics closely after deployment")
        
        return recommendations
    
    def _determine_optimal_window(self, features: Dict[str, Any], risk_score: float) -> str:
        """
        Determine optimal deployment window
        
        Args:
            features: Dictionary of features
            risk_score: Predicted risk score
            
        Returns:
            str: Optimal deployment window
        """
        # Start with current day
        current_day = datetime.utcnow()
        
        # Find next Tuesday, Wednesday, or Thursday (typically safer deployment days)
        days_ahead = {
            'Monday': 1,    # Next Tuesday
            'Tuesday': 0,   # Today if morning, else next Tuesday
            'Wednesday': 0, # Today if morning, else next Wednesday
            'Thursday': 0,  # Today if morning, else next Thursday
            'Friday': 4,    # Next Tuesday
            'Saturday': 3,  # Next Tuesday
            'Sunday': 2     # Next Tuesday
        }
        
        current_day_name = current_day.strftime('%A')
        
        # If it's already afternoon or later, move to next day
        if current_day.hour >= 12 and days_ahead[current_day_name] == 0:
            days_ahead[current_day_name] = 7  # Next week same day
        
        days_to_add = days_ahead[current_day_name]
        optimal_day = current_day + timedelta(days=days_to_add)
        
        # Determine optimal time (10:00-12:00 or 14:00-16:00)
        if risk_score > 0.6:
            # Higher risk deployments in morning when more staff available
            optimal_time = "10:00-12:00"
        else:
            # Lower risk deployments in afternoon
            optimal_time = "14:00-16:00"
        
        return f"{optimal_day.strftime('%A')} {optimal_time}"
    
    def generate_mock_training_data(self, num_samples: int = 1000) -> pd.DataFrame:
        """
        Generate mock training data for model development
        
        Args:
            num_samples: Number of samples to generate
            
        Returns:
            pd.DataFrame: Mock training data
        """
        np.random.seed(42)
        
        # Generate random features
        data = {
            'component_count': np.random.randint(1, 20, num_samples),
            'alert_count_7d': np.random.randint(0, 30, num_samples),
            'alert_count_30d': np.random.randint(0, 100, num_samples),
            'deployment_count_7d': np.random.randint(0, 10, num_samples),
            'deployment_count_30d': np.random.randint(0, 30, num_samples),
            'failure_rate_30d': np.random.uniform(0, 0.5, num_samples),
            'avg_resolution_time': np.random.uniform(10, 300, num_samples),
            'component_criticality': np.random.uniform(0, 1, num_samples),
            'day_of_week': np.random.choice(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], num_samples),
            'time_of_day': np.random.choice(['morning', 'afternoon', 'evening', 'night'], num_samples),
            'deployment_type': np.random.choice(['regular', 'hotfix', 'major', 'minor'], num_samples)
        }
        
        # Create DataFrame
        df = pd.DataFrame(data)
        
        # Generate risk score based on features (simplified model for mock data)
        risk_score = (
            0.1 * (df['component_count'] / 20) +
            0.15 * (df['alert_count_7d'] / 30) +
            0.1 * (df['alert_count_30d'] / 100) +
            0.1 * (df['deployment_count_7d'] / 10) +
            0.05 * (df['deployment_count_30d'] / 30) +
            0.2 * df['failure_rate_30d'] +
            0.1 * (df['avg_resolution_time'] / 300) +
            0.2 * df['component_criticality']
        )
        
        # Add day of week factor
        day_factor = df['day_of_week'].map({
            'Monday': 0.05,
            'Tuesday': 0.0,
            'Wednesday': 0.0,
            'Thursday': 0.02,
            'Friday': 0.1,
            'Saturday': 0.15,
            'Sunday': 0.15
        })
        
        # Add time of day factor
        time_factor = df['time_of_day'].map({
            'morning': 0.0,
            'afternoon': 0.02,
            'evening': 0.1,
            'night': 0.15
        })
        
        # Add deployment type factor
        type_factor = df['deployment_type'].map({
            'regular': 0.05,
            'minor': 0.02,
            'major': 0.1,
            'hotfix': 0.15
        })
        
        # Combine all factors
        risk_score = risk_score + day_factor + time_factor + type_factor
        
        # Clamp between 0 and 1
        risk_score = np.clip(risk_score, 0, 1)
        
        # Add some random noise
        noise = np.random.normal(0, 0.05, num_samples)
        risk_score = np.clip(risk_score + noise, 0, 1)
        
        df['risk_score'] = risk_score
        
        return df
    
    def train_with_mock_data(self, num_samples: int = 1000, model_path: Optional[str] = None):
        """
        Train model with generated mock data
        
        Args:
            num_samples: Number of samples to generate
            model_path: Path to save trained model
        """
        # Generate mock data
        mock_data = self.generate_mock_training_data(num_samples)
        
        # Train model
        self.train(mock_data)
        
        # Save model if path provided
        if model_path:
            self.save_model(model_path)
        
        return mock_data
