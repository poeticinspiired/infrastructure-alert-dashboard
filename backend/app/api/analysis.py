"""
Updated API endpoints for analysis with BFS and Union-Find integration
"""
from flask import request, current_app
from flask_restx import Namespace, Resource, fields, reqparse
from app.services.analysis_service import analyze_impact, analyze_failure_domains, analyze_health_status

api = Namespace('analysis', description='Infrastructure analysis operations')

# Models for request/response serialization
analysis_result_model = api.model('AnalysisResult', {
    'source_component': fields.String(required=True, description='Source component ID'),
    'affected_components': fields.List(fields.String, required=True, description='List of affected component IDs'),
    'failure_domains': fields.List(fields.List(fields.String), required=True, description='List of connected component groups'),
    'impact_score': fields.Float(required=True, description='Overall impact score'),
    'timestamp': fields.String(required=True, description='Analysis timestamp')
})

analysis_request_model = api.model('AnalysisRequest', {
    'component_ids': fields.List(fields.String, required=True, description='List of component IDs to analyze')
})

# Parser for query parameters
analysis_parser = reqparse.RequestParser()
analysis_parser.add_argument('component_id', type=str, required=True, help='Source component ID for analysis')


@api.route('/impact')
class ImpactAnalysis(Resource):
    @api.doc('analyze_impact')
    @api.expect(analysis_parser)
    @api.marshal_with(analysis_result_model)
    def get(self):
        """Analyze impact of an issue in the source component using BFS"""
        args = analysis_parser.parse_args()
        component_id = args['component_id']
        
        # Use the analysis service to perform BFS impact analysis
        result = analyze_impact(component_id)
        
        return result


@api.route('/failure-domains')
class FailureDomainAnalysis(Resource):
    @api.doc('analyze_failure_domains')
    @api.expect(analysis_request_model)
    @api.marshal_with(analysis_result_model)
    def post(self):
        """Identify connected failure domains using Union-Find algorithm"""
        data = request.json
        component_ids = data.get('component_ids', [])
        
        if not component_ids:
            api.abort(400, "Component IDs list is required")
        
        # Use the analysis service to perform Union-Find analysis
        result = analyze_failure_domains(component_ids)
        
        return result


@api.route('/health-status')
class HealthStatusAnalysis(Resource):
    @api.doc('analyze_health_status')
    @api.marshal_with(analysis_result_model)
    def get(self):
        """Analyze overall infrastructure health status"""
        # Use the analysis service to perform health status analysis
        result = analyze_health_status()
        
        return result
