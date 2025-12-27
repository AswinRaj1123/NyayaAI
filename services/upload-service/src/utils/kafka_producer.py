from kafka import KafkaProducer
import json
import os

bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

producer = KafkaProducer(
    bootstrap_servers=bootstrap_servers,
    value_serializer=lambda v: json.dumps(v).encode('utf-8'),
    acks='all',  # Wait for all replicas (safe)
    retries=3
)

def publish_document_uploaded(event: dict):
    try:
        producer.send("document_uploaded", value=event)
        producer.flush()  # Ensure sent before response
        print(f"Published event: {event['document_id']}")
    except Exception as e:
        print(f"Kafka publish error: {e}")
        # In prod: use dead-letter queue or retry logic