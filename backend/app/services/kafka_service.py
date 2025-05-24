"""
Kafka service for handling real-time data streaming
"""
import json
import logging
import threading
from confluent_kafka import Consumer, Producer, KafkaError, KafkaException
from flask import current_app

logger = logging.getLogger(__name__)

class KafkaService:
    """Service for interacting with Kafka for real-time data streaming"""
    
    def __init__(self, bootstrap_servers):
        """Initialize Kafka producer and consumer"""
        self.bootstrap_servers = bootstrap_servers
        self.producer = self._create_producer()
        self.consumers = {}
        self.consumer_threads = {}
        
    def _create_producer(self):
        """Create and configure Kafka producer"""
        return Producer({
            'bootstrap.servers': self.bootstrap_servers,
            'client.id': 'alert-dashboard-producer',
            'acks': 'all',
            'retries': 5,
            'retry.backoff.ms': 500,
        })
    
    def _create_consumer(self, group_id, topics):
        """Create and configure Kafka consumer"""
        return Consumer({
            'bootstrap.servers': self.bootstrap_servers,
            'group.id': group_id,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': True,
            'auto.commit.interval.ms': 5000,
        })
    
    def publish_message(self, topic, key, value):
        """Publish message to Kafka topic"""
        try:
            self.producer.produce(
                topic=topic,
                key=key.encode('utf-8') if key else None,
                value=json.dumps(value).encode('utf-8'),
                callback=self._delivery_report
            )
            # Flush to ensure message is sent
            self.producer.flush()
            logger.info(f"Published message to {topic}: {key}")
            return True
        except KafkaException as e:
            logger.error(f"Failed to publish message to {topic}: {e}")
            return False
    
    def _delivery_report(self, err, msg):
        """Callback for message delivery reports"""
        if err is not None:
            logger.error(f"Message delivery failed: {err}")
        else:
            logger.debug(f"Message delivered to {msg.topic()} [{msg.partition()}]")
    
    def subscribe(self, group_id, topics, message_handler):
        """Subscribe to Kafka topics and process messages with handler"""
        if group_id in self.consumers:
            logger.warning(f"Consumer group {group_id} already exists")
            return False
        
        consumer = self._create_consumer(group_id, topics)
        consumer.subscribe(topics)
        self.consumers[group_id] = consumer
        
        # Start consumer thread
        thread = threading.Thread(
            target=self._consume_loop,
            args=(group_id, consumer, message_handler),
            daemon=True
        )
        thread.start()
        self.consumer_threads[group_id] = thread
        
        logger.info(f"Started consumer group {group_id} for topics {topics}")
        return True
    
    def _consume_loop(self, group_id, consumer, message_handler):
        """Continuously consume messages from subscribed topics"""
        try:
            while True:
                msg = consumer.poll(timeout=1.0)
                if msg is None:
                    continue
                
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        logger.debug(f"Reached end of partition for {msg.topic()}")
                    else:
                        logger.error(f"Consumer error: {msg.error()}")
                else:
                    # Process message
                    try:
                        key = msg.key().decode('utf-8') if msg.key() else None
                        value = json.loads(msg.value().decode('utf-8'))
                        message_handler(key, value)
                    except Exception as e:
                        logger.error(f"Error processing message: {e}")
        except Exception as e:
            logger.error(f"Consumer thread error: {e}")
        finally:
            consumer.close()
            logger.info(f"Consumer group {group_id} closed")
            
    def unsubscribe(self, group_id):
        """Unsubscribe and close consumer group"""
        if group_id not in self.consumers:
            logger.warning(f"Consumer group {group_id} does not exist")
            return False
        
        consumer = self.consumers[group_id]
        consumer.close()
        del self.consumers[group_id]
        
        # Wait for thread to terminate
        if group_id in self.consumer_threads:
            self.consumer_threads[group_id].join(timeout=5.0)
            del self.consumer_threads[group_id]
        
        logger.info(f"Unsubscribed consumer group {group_id}")
        return True
    
    def close(self):
        """Close all consumers and producer"""
        for group_id in list(self.consumers.keys()):
            self.unsubscribe(group_id)
        
        self.producer.flush()
        logger.info("Kafka service closed")


# Singleton instance
_kafka_service = None

def get_kafka_service():
    """Get or create the Kafka service singleton"""
    global _kafka_service
    if _kafka_service is None:
        bootstrap_servers = current_app.config['KAFKA_BOOTSTRAP_SERVERS']
        _kafka_service = KafkaService(bootstrap_servers)
    return _kafka_service
