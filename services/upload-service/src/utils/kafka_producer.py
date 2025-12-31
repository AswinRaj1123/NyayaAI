import json
import os
import time
from kafka import KafkaProducer
from kafka.errors import NoBrokersAvailable

bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

_producer = None


def _get_producer():
    global _producer
    if _producer:
        return _producer

    # Retry a few times in case Kafka is still starting up
    attempts = 0
    while attempts < 5:
        try:
            _producer = KafkaProducer(
                bootstrap_servers=bootstrap_servers,
                value_serializer=lambda v: json.dumps(v).encode("utf-8"),
                acks="all",
                retries=3,
            )
            return _producer
        except NoBrokersAvailable:
            attempts += 1
            wait = 2 * attempts
            print(f"Kafka not ready, retrying in {wait}s (attempt {attempts}/5)")
            time.sleep(wait)

    raise NoBrokersAvailable("Kafka broker not reachable after retries")


def publish_document_uploaded(event: dict):
    producer = _get_producer()
    try:
        producer.send("document_uploaded", value=event)
        producer.flush()
        print(f"Published event: {event['document_id']}")
    except Exception as e:
        print(f"Kafka publish error: {e}")
        # In prod: use DLQ or retry queue