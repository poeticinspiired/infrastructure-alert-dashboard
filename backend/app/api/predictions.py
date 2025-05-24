"""
Updated API endpoints for predictions with ML model integration
"""
from flask import request, current_app
from flask_restx import Namespace, Resource, fields, reqparse
from app.services.prediction_service import predict_deployment_risk, get_optimal_deployment_windows
from datetime import datetime

api = Namespace('predictions', description='Deployment risk prediction operations')

# Models for request/response serialization
prediction_model = api.model('DeploymentPrediction', {
    'deployment_id': fields.String(required=True, description='Deployment identifier'),
    'components': fields.List(fields.String, required=True, description='List of affected component IDs'),
    'risk_score': fields.Float(required=True, description='Risk score (0-1)'),
    'risk_factors': fields.List(fields.String, required=True, description='List of identified risk factors'),
    'recommended_actions': fields.List(fields.String, required=True, description='List of recommended actions'),
    'optimal_window': fields.String(description='Recommended deployment time window'),
    'timestamp': fields.String(required=True, description='Prediction timestamp')
})

deployment_model = api.model('DeploymentRequest', {
    'deployment_id': fields.String(required=True, description='Deployment identifier'),
    'components': fields.List(fields.String, required=True, description='List of affected component IDs'),
    'changes': fields.List(fields.String, required=True, description='List of changes to be made'),
    'planned_time': fields.String(description='Planned deployment time'),
    'deployment_type': fields.String(description='Type of deployment (regular, hotfix, major, minor)'),
    'metadata': fields.Raw(description='Additional deployment metadata')
})

optimal_window_model = api.model('OptimalWindow', {
    'time': fields.String(required=True, description='Time window'),
    'risk_level': fields.String(required=True, description='Risk level (low, medium, high)')
})

optimal_windows_model = api.model('OptimalWindows', {
    'Monday': fields.List(fields.Nested(optimal_window_model)),
    'Tuesday': fields.List(fields.Nested(optimal_window_model)),
    'Wednesday': fields.List(fields.Nested(optimal_window_model)),
    'Thursday': fields.List(fields.Nested(optimal_window_model)),
    'Friday': fields.List(fields.Nested(optimal_window_model)),
    'Saturday': fields.List(fields.Nested(optimal_window_model)),
    'Sunday': fields.List(fields.Nested(optimal_window_model))
})

# Parser for query parameters
prediction_parser = reqparse.RequestParser()
prediction_parser.add_argument('deployment_id', type=str, help='Filter by deployment ID')
prediction_parser.add_argument('component_id', type=str, help='Filter by affected component ID')
prediction_parser.add_argument('min_risk', type=float, help='Minimum risk score')
prediction_parser.add_argument('max_risk', type=float, help='Maximum risk score')
prediction_parser.add_argument('limit', type=int, default=10, help='Maximum number of predictions to return')


@api.route('/')
class PredictionList(Resource):
    @api.doc('list_predictions')
    @api.expect(prediction_parser)
    @api.marshal_list_with(prediction_model)
    def get(self):
        """List deployment risk predictions with optional filtering"""
        args = prediction_parser.parse_args()
        
        # This would be replaced with actual database query
        # For now, return mock data
        predictions = [
            {
                'deployment_id': 'deploy-001',
                'components': ['app-001', 'app-002'],
                'risk_score': 0.75,
                'risk_factors': [
                    'High number of recent alerts in target components',
                    'Weekend deployment',
                    'Multiple critical components affected'
                ],
                'recommended_actions': [
                    'Schedule deployment during business hours',
                    'Increase monitoring during deployment',
                    'Prepare rollback plan'
                ],
                'optimal_window': 'Tuesday 10:00-12:00',
                'timestamp': datetime.utcnow().isoformat()
            },
            {
                'deployment_id': 'deploy-002',
                'components': ['db-001'],
                'risk_score': 0.35,
                'risk_factors': [
                    'Database schema changes'
                ],
                'recommended_actions': [
                    'Run migration tests in staging',
                    'Backup database before deployment'
                ],
                'optimal_window': 'Wednesday 14:00-16:00',
                'timestamp': datetime.utcnow().isoformat()
            }
        ]
        
        return predictions
    
    @api.doc('predict_deployment_risk')
    @api.expect(deployment_model)
    @api.marshal_with(prediction_model)
    def post(self):
        """Predict risk for a planned deployment using ML model"""
        data = request.json
        
        # Use the prediction service to predict deployment risk
        prediction = predict_deployment_risk(data)
        
        return prediction


@api.route('/<string:deployment_id>')
@api.param('deployment_id', 'The deployment identifier')
@api.response(404, 'Deployment prediction not found')
class PredictionItem(Resource):
    @api.doc('get_prediction')
    @api.marshal_with(prediction_model)
    def get(self, deployment_id):
        """Get a specific deployment risk prediction"""
        # This would be replaced with actual database query
        # For now, return mock data if ID matches pattern
        if deployment_id.startswith("deploy-"):
            # Create a mock deployment request to generate a prediction
            mock_deployment = {
                'deployment_id': deployment_id,
                'components': ['app-001', 'app-002'],
                'changes': ['Update service version', 'Configuration change'],
                'planned_time': datetime.utcnow().isoformat(),
                'deployment_type': 'regular'
            }
            
            # Use the prediction service to predict deployment risk
            prediction = predict_deployment_risk(mock_deployment)
            
            return prediction
        
        api.abort(404, f"Deployment prediction {deployment_id} not found")


@api.route('/windows')
class OptimalWindows(Resource):
    @api.doc('get_optimal_windows')
    @api.marshal_with(optimal_windows_model)
    def get(self):
        """Get recommended deployment windows for the next 7 days"""
        # Use the prediction service to get optimal deployment windows
        windows = get_optimal_deployment_windows()
        
        return windows
