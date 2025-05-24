"""
API endpoints for infrastructure components
"""
import uuid
from datetime import datetime
from flask import request, current_app
from flask_restx import Namespace, Resource, fields, reqparse
from app.models.infrastructure import InfrastructureComponent, ComponentType, ComponentStatus
from app.services.kafka_service import get_kafka_service

api = Namespace('infrastructure', description='Infrastructure component operations')

# Models for request/response serialization
component_type_model = api.enum('ComponentType', {t.name: t.value for t in ComponentType})
component_status_model = api.enum('ComponentStatus', {s.name: s.value for s in ComponentStatus})

component_model = api.model('InfrastructureComponent', {
    'component_id': fields.String(required=True, description='Unique component identifier'),
    'name': fields.String(required=True, description='Component name'),
    'component_type': fields.String(required=True, description='Component type', enum=[t.value for t in ComponentType]),
    'status': fields.String(required=True, description='Component status', enum=[s.value for s in ComponentStatus]),
    'metadata': fields.Raw(description='Additional component metadata'),
    'dependencies': fields.List(fields.String, description='List of dependency component IDs'),
    'dependents': fields.List(fields.String, description='List of dependent component IDs'),
    'location': fields.String(description='Component location'),
    'owner': fields.String(description='Component owner'),
    'created_at': fields.DateTime(description='Creation timestamp'),
    'updated_at': fields.DateTime(description='Last update timestamp'),
    'active_alerts': fields.List(fields.String, description='List of active alert IDs')
})

component_create_model = api.model('ComponentCreate', {
    'name': fields.String(required=True, description='Component name'),
    'component_type': fields.String(required=True, description='Component type', enum=[t.value for t in ComponentType]),
    'status': fields.String(description='Initial component status', enum=[s.value for s in ComponentStatus]),
    'metadata': fields.Raw(description='Additional component metadata'),
    'location': fields.String(description='Component location'),
    'owner': fields.String(description='Component owner')
})

component_update_model = api.model('ComponentUpdate', {
    'name': fields.String(description='Updated component name'),
    'status': fields.String(description='Updated component status', enum=[s.value for s in ComponentStatus]),
    'metadata': fields.Raw(description='Updated component metadata'),
    'location': fields.String(description='Updated component location'),
    'owner': fields.String(description='Updated component owner')
})

relationship_model = api.model('ComponentRelationship', {
    'dependent_id': fields.String(required=True, description='ID of the dependent component'),
    'dependency_id': fields.String(required=True, description='ID of the dependency component')
})

# Parser for query parameters
component_parser = reqparse.RequestParser()
component_parser.add_argument('type', type=str, help='Filter by component type')
component_parser.add_argument('status', type=str, help='Filter by component status')
component_parser.add_argument('location', type=str, help='Filter by component location')
component_parser.add_argument('owner', type=str, help='Filter by component owner')
component_parser.add_argument('has_alerts', type=bool, help='Filter components with active alerts')
component_parser.add_argument('limit', type=int, default=100, help='Maximum number of components to return')
component_parser.add_argument('offset', type=int, default=0, help='Offset for pagination')


@api.route('/')
class ComponentList(Resource):
    @api.doc('list_components')
    @api.expect(component_parser)
    @api.marshal_list_with(component_model)
    def get(self):
        """List all infrastructure components with optional filtering"""
        args = component_parser.parse_args()
        
        # This would be replaced with actual database query
        # For now, return mock data
        components = [
            InfrastructureComponent(
                component_id="server-001",
                name="Web Server 1",
                component_type=ComponentType.SERVER,
                status=ComponentStatus.HEALTHY,
                location="us-east-1",
                owner="platform-team"
            ),
            InfrastructureComponent(
                component_id="db-001",
                name="Primary Database",
                component_type=ComponentType.DATABASE,
                status=ComponentStatus.HEALTHY,
                location="us-east-1",
                owner="database-team"
            ),
            InfrastructureComponent(
                component_id="app-001",
                name="User Service",
                component_type=ComponentType.APPLICATION,
                status=ComponentStatus.DEGRADED,
                location="us-east-1",
                owner="user-team",
                dependencies=["server-001", "db-001"]
            )
        ]
        
        return [component.to_dict() for component in components]
    
    @api.doc('create_component')
    @api.expect(component_create_model)
    @api.marshal_with(component_model, code=201)
    def post(self):
        """Create a new infrastructure component"""
        data = request.json
        
        # Generate unique ID
        component_id = f"{data['component_type']}-{uuid.uuid4().hex[:8]}"
        
        # Create component object
        component = InfrastructureComponent(
            component_id=component_id,
            name=data['name'],
            component_type=data['component_type'],
            status=data.get('status', ComponentStatus.UNKNOWN),
            metadata=data.get('metadata', {}),
            location=data.get('location'),
            owner=data.get('owner')
        )
        
        # In a real implementation, save to database
        
        # Publish to Kafka
        kafka_service = get_kafka_service()
        kafka_service.publish_message(
            topic=current_app.config['KAFKA_INFRASTRUCTURE_TOPIC'],
            key=component_id,
            value=component.to_dict()
        )
        
        return component.to_dict(), 201


@api.route('/<string:component_id>')
@api.param('component_id', 'The component identifier')
@api.response(404, 'Component not found')
class ComponentItem(Resource):
    @api.doc('get_component')
    @api.marshal_with(component_model)
    def get(self, component_id):
        """Get a specific infrastructure component"""
        # This would be replaced with actual database query
        # For now, return mock data if ID matches pattern
        if component_id in ["server-001", "db-001", "app-001"]:
            component = InfrastructureComponent(
                component_id=component_id,
                name="Mock Component",
                component_type=ComponentType.SERVER,
                status=ComponentStatus.HEALTHY,
                location="us-east-1",
                owner="platform-team"
            )
            return component.to_dict()
        
        api.abort(404, f"Component {component_id} not found")
    
    @api.doc('update_component')
    @api.expect(component_update_model)
    @api.marshal_with(component_model)
    def put(self, component_id):
        """Update an infrastructure component"""
        # This would be replaced with actual database query and update
        # For now, return mock data if ID matches pattern
        if component_id in ["server-001", "db-001", "app-001"]:
            data = request.json
            
            # In a real implementation, fetch from database
            component = InfrastructureComponent(
                component_id=component_id,
                name="Mock Component",
                component_type=ComponentType.SERVER,
                status=ComponentStatus.HEALTHY,
                location="us-east-1",
                owner="platform-team"
            )
            
            # Update fields
            if 'name' in data:
                component.name = data['name']
            
            if 'status' in data:
                component.update_status(data['status'])
            
            if 'metadata' in data:
                component.metadata.update(data['metadata'])
            
            if 'location' in data:
                component.location = data['location']
            
            if 'owner' in data:
                component.owner = data['owner']
            
            # In a real implementation, save to database
            
            # Publish to Kafka
            kafka_service = get_kafka_service()
            kafka_service.publish_message(
                topic=current_app.config['KAFKA_INFRASTRUCTURE_TOPIC'],
                key=component_id,
                value=component.to_dict()
            )
            
            return component.to_dict()
        
        api.abort(404, f"Component {component_id} not found")
    
    @api.doc('delete_component')
    @api.response(204, 'Component deleted')
    def delete(self, component_id):
        """Delete an infrastructure component"""
        # This would be replaced with actual database query and delete
        # For now, return success if ID matches pattern
        if component_id in ["server-001", "db-001", "app-001"]:
            # In a real implementation, delete from database
            
            # Publish deletion event to Kafka
            kafka_service = get_kafka_service()
            kafka_service.publish_message(
                topic=current_app.config['KAFKA_INFRASTRUCTURE_TOPIC'],
                key=component_id,
                value={"action": "delete", "component_id": component_id}
            )
            
            return '', 204
        
        api.abort(404, f"Component {component_id} not found")


@api.route('/relationships')
class ComponentRelationships(Resource):
    @api.doc('create_relationship')
    @api.expect(relationship_model)
    @api.response(201, 'Relationship created')
    def post(self):
        """Create a dependency relationship between components"""
        data = request.json
        dependent_id = data['dependent_id']
        dependency_id = data['dependency_id']
        
        # This would be replaced with actual database query and update
        # For now, return success if IDs match pattern
        if dependent_id in ["server-001", "db-001", "app-001"] and dependency_id in ["server-001", "db-001", "app-001"]:
            # In a real implementation, update both components in database
            
            # Publish relationship event to Kafka
            kafka_service = get_kafka_service()
            kafka_service.publish_message(
                topic=current_app.config['KAFKA_INFRASTRUCTURE_TOPIC'],
                key=f"{dependent_id}-{dependency_id}",
                value={
                    "action": "add_relationship",
                    "dependent_id": dependent_id,
                    "dependency_id": dependency_id
                }
            )
            
            return '', 201
        
        api.abort(404, "One or both components not found")
    
    @api.doc('delete_relationship')
    @api.expect(relationship_model)
    @api.response(204, 'Relationship deleted')
    def delete(self):
        """Delete a dependency relationship between components"""
        data = request.json
        dependent_id = data['dependent_id']
        dependency_id = data['dependency_id']
        
        # This would be replaced with actual database query and update
        # For now, return success if IDs match pattern
        if dependent_id in ["server-001", "db-001", "app-001"] and dependency_id in ["server-001", "db-001", "app-001"]:
            # In a real implementation, update both components in database
            
            # Publish relationship event to Kafka
            kafka_service = get_kafka_service()
            kafka_service.publish_message(
                topic=current_app.config['KAFKA_INFRASTRUCTURE_TOPIC'],
                key=f"{dependent_id}-{dependency_id}",
                value={
                    "action": "remove_relationship",
                    "dependent_id": dependent_id,
                    "dependency_id": dependency_id
                }
            )
            
            return '', 204
        
        api.abort(404, "One or both components not found")


@api.route('/<string:component_id>/affected')
@api.param('component_id', 'The source component identifier')
@api.response(404, 'Component not found')
class AffectedComponents(Resource):
    @api.doc('get_affected_components')
    @api.marshal_list_with(component_model)
    def get(self, component_id):
        """Get all components affected by an issue in the source component"""
        # This would be replaced with actual graph traversal using BFS
        # For now, return mock data if ID matches pattern
        if component_id in ["server-001", "db-001", "app-001"]:
            # Mock affected components
            affected_components = [
                InfrastructureComponent(
                    component_id="app-001",
                    name="User Service",
                    component_type=ComponentType.APPLICATION,
                    status=ComponentStatus.DEGRADED,
                    location="us-east-1",
                    owner="user-team"
                ),
                InfrastructureComponent(
                    component_id="app-002",
                    name="Order Service",
                    component_type=ComponentType.APPLICATION,
                    status=ComponentStatus.WARNING,
                    location="us-east-1",
                    owner="order-team"
                )
            ]
            
            return [component.to_dict() for component in affected_components]
        
        api.abort(404, f"Component {component_id} not found")
