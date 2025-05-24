"""
API endpoints for alerts
"""
import uuid
from datetime import datetime
from flask import request, current_app
from flask_restx import Namespace, Resource, fields, reqparse
from app.models.alert import Alert, AlertSeverity, AlertStatus
from app.services.kafka_service import get_kafka_service

api = Namespace('alerts', description='Alert operations')

# Models for request/response serialization
severity_model = api.enum('AlertSeverity', {s.name: s.value for s in AlertSeverity})
status_model = api.enum('AlertStatus', {s.name: s.value for s in AlertStatus})

alert_model = api.model('Alert', {
    'alert_id': fields.String(required=True, description='Unique alert identifier'),
    'timestamp': fields.DateTime(required=True, description='Alert timestamp'),
    'source_component': fields.String(required=True, description='Source component ID'),
    'alert_type': fields.String(required=True, description='Type of alert'),
    'severity': fields.String(required=True, description='Alert severity', enum=[s.value for s in AlertSeverity]),
    'description': fields.String(required=True, description='Alert description'),
    'status': fields.String(required=True, description='Alert status', enum=[s.value for s in AlertStatus]),
    'affected_components': fields.List(fields.String, description='List of affected component IDs'),
    'metadata': fields.Raw(description='Additional alert metadata'),
    'assigned_to': fields.String(description='User assigned to the alert'),
    'resolution_time': fields.DateTime(description='Resolution timestamp'),
    'resolution_notes': fields.String(description='Notes on resolution')
})

alert_create_model = api.model('AlertCreate', {
    'source_component': fields.String(required=True, description='Source component ID'),
    'alert_type': fields.String(required=True, description='Type of alert'),
    'severity': fields.String(required=True, description='Alert severity', enum=[s.value for s in AlertSeverity]),
    'description': fields.String(required=True, description='Alert description'),
    'metadata': fields.Raw(description='Additional alert metadata')
})

alert_update_model = api.model('AlertUpdate', {
    'status': fields.String(description='New alert status', enum=[s.value for s in AlertStatus]),
    'severity': fields.String(description='Updated severity', enum=[s.value for s in AlertSeverity]),
    'assigned_to': fields.String(description='User assigned to the alert'),
    'resolution_notes': fields.String(description='Notes on resolution')
})

# Parser for query parameters
alert_parser = reqparse.RequestParser()
alert_parser.add_argument('status', type=str, help='Filter by alert status')
alert_parser.add_argument('severity', type=str, help='Filter by alert severity')
alert_parser.add_argument('component', type=str, help='Filter by source or affected component')
alert_parser.add_argument('from_date', type=str, help='Filter alerts from this date (ISO format)')
alert_parser.add_argument('to_date', type=str, help='Filter alerts to this date (ISO format)')
alert_parser.add_argument('limit', type=int, default=100, help='Maximum number of alerts to return')
alert_parser.add_argument('offset', type=int, default=0, help='Offset for pagination')


@api.route('/')
class AlertList(Resource):
    @api.doc('list_alerts')
    @api.expect(alert_parser)
    @api.marshal_list_with(alert_model)
    def get(self):
        """List all alerts with optional filtering"""
        args = alert_parser.parse_args()
        
        # This would be replaced with actual database query
        # For now, return mock data
        alerts = [
            Alert(
                alert_id="alert-001",
                timestamp=datetime.utcnow(),
                source_component="server-001",
                alert_type="cpu_high",
                severity=AlertSeverity.HIGH,
                description="CPU usage above 90% for 5 minutes",
                status=AlertStatus.NEW,
                affected_components=["app-001", "app-002"]
            ),
            Alert(
                alert_id="alert-002",
                timestamp=datetime.utcnow(),
                source_component="db-001",
                alert_type="disk_space_low",
                severity=AlertSeverity.CRITICAL,
                description="Database disk space below 10%",
                status=AlertStatus.ACKNOWLEDGED,
                affected_components=["app-003"]
            )
        ]
        
        return [alert.to_dict() for alert in alerts]
    
    @api.doc('create_alert')
    @api.expect(alert_create_model)
    @api.marshal_with(alert_model, code=201)
    def post(self):
        """Create a new alert"""
        data = request.json
        
        # Generate unique ID
        alert_id = f"alert-{uuid.uuid4()}"
        
        # Create alert object
        alert = Alert(
            alert_id=alert_id,
            timestamp=datetime.utcnow(),
            source_component=data['source_component'],
            alert_type=data['alert_type'],
            severity=data['severity'],
            description=data['description'],
            metadata=data.get('metadata', {})
        )
        
        # In a real implementation, save to database
        
        # Publish to Kafka
        kafka_service = get_kafka_service()
        kafka_service.publish_message(
            topic=current_app.config['KAFKA_ALERT_TOPIC'],
            key=alert_id,
            value=alert.to_dict()
        )
        
        return alert.to_dict(), 201


@api.route('/<string:alert_id>')
@api.param('alert_id', 'The alert identifier')
@api.response(404, 'Alert not found')
class AlertItem(Resource):
    @api.doc('get_alert')
    @api.marshal_with(alert_model)
    def get(self, alert_id):
        """Get a specific alert"""
        # This would be replaced with actual database query
        # For now, return mock data if ID matches pattern
        if alert_id.startswith("alert-"):
            alert = Alert(
                alert_id=alert_id,
                timestamp=datetime.utcnow(),
                source_component="server-001",
                alert_type="cpu_high",
                severity=AlertSeverity.HIGH,
                description="CPU usage above 90% for 5 minutes",
                status=AlertStatus.NEW,
                affected_components=["app-001", "app-002"]
            )
            return alert.to_dict()
        
        api.abort(404, f"Alert {alert_id} not found")
    
    @api.doc('update_alert')
    @api.expect(alert_update_model)
    @api.marshal_with(alert_model)
    def put(self, alert_id):
        """Update an alert"""
        # This would be replaced with actual database query and update
        # For now, return mock data if ID matches pattern
        if alert_id.startswith("alert-"):
            data = request.json
            
            # In a real implementation, fetch from database
            alert = Alert(
                alert_id=alert_id,
                timestamp=datetime.utcnow(),
                source_component="server-001",
                alert_type="cpu_high",
                severity=AlertSeverity.HIGH,
                description="CPU usage above 90% for 5 minutes",
                status=AlertStatus.NEW,
                affected_components=["app-001", "app-002"]
            )
            
            # Update fields
            if 'status' in data:
                alert.update_status(data['status'], "system", "Status updated via API")
            
            if 'severity' in data:
                alert.severity = data['severity']
            
            if 'assigned_to' in data:
                alert.assigned_to = data['assigned_to']
            
            if 'resolution_notes' in data and data['status'] == AlertStatus.RESOLVED:
                alert.resolution_notes = data['resolution_notes']
                alert.resolution_time = datetime.utcnow()
            
            # In a real implementation, save to database
            
            # Publish to Kafka
            kafka_service = get_kafka_service()
            kafka_service.publish_message(
                topic=current_app.config['KAFKA_ALERT_TOPIC'],
                key=alert_id,
                value=alert.to_dict()
            )
            
            return alert.to_dict()
        
        api.abort(404, f"Alert {alert_id} not found")
    
    @api.doc('delete_alert')
    @api.response(204, 'Alert deleted')
    def delete(self, alert_id):
        """Delete an alert"""
        # This would be replaced with actual database query and delete
        # For now, return success if ID matches pattern
        if alert_id.startswith("alert-"):
            # In a real implementation, delete from database
            
            # Publish deletion event to Kafka
            kafka_service = get_kafka_service()
            kafka_service.publish_message(
                topic=current_app.config['KAFKA_ALERT_TOPIC'],
                key=alert_id,
                value={"action": "delete", "alert_id": alert_id}
            )
            
            return '', 204
        
        api.abort(404, f"Alert {alert_id} not found")
