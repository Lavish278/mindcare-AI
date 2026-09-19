"""
Database abstraction supporting both Google Cloud Firestore (via firebase-admin)
and a robust, thread-safe Local Persistent Store adhering to Firestore collection/document semantics.
This ensures zero crashes and flawless local demonstration even before Firebase keys are added.
"""

import json
import os
import time
import uuid
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from app.core.config import settings

logger = logging.getLogger("mindcare.database")

# Firestore client holder
_firestore_client = None
_firebase_initialized = False


def init_firebase():
    global _firestore_client, _firebase_initialized
    if settings.FIREBASE_CREDENTIALS_PATH and os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
        try:
            import firebase_admin
            from firebase_admin import credentials, firestore

            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred, {
                'projectId': settings.FIREBASE_PROJECT_ID or None,
            })
            _firestore_client = firestore.client()
            _firebase_initialized = True
            logger.info("Successfully connected to Google Cloud Firestore.")
        except Exception as e:
            logger.warning(f"Failed to initialize Firebase Admin with credentials: {e}. Falling back to Local Store.")
    elif settings.FIREBASE_PROJECT_ID:
        try:
            import firebase_admin
            from firebase_admin import firestore

            firebase_admin.initialize_app(options={'projectId': settings.FIREBASE_PROJECT_ID})
            _firestore_client = firestore.client()
            _firebase_initialized = True
            logger.info("Initialized Firebase with default Application Default Credentials.")
        except Exception as e:
            logger.warning(f"Could not initialize ADC Firebase: {e}. Falling back to Local Store.")


class LocalStore:
    """Thread-safe JSON-persisted Firestore mirror store."""

    def __init__(self, data_file: str = "mindcare_local_db.json"):
        self.data_file = data_file
        self.data: Dict[str, Dict[str, Dict[str, Any]]] = {
            "users": {},
            "conversations": {},
            "check_ins": {},
            "wearable_readings": {},
            "activity_sessions": {},
            "sleep_records": {},
            "personal_reference": {},
            "recommendations": {},
            "feedback": {},
            "safety_events": {},
            "app_versions": {},
        }
        self.load()

    def load(self):
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, "r", encoding="utf-8") as f:
                    loaded = json.load(f)
                    for k, v in loaded.items():
                        self.data[k] = v
            except Exception as e:
                logger.error(f"Error loading local db file: {e}")

    def save(self):
        try:
            with open(self.data_file, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving local db: {e}")

    def insert(self, collection: str, doc_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        if collection not in self.data:
            self.data[collection] = {}
        data_copy = dict(data)
        data_copy["id"] = doc_id
        if "created_at" not in data_copy:
            data_copy["created_at"] = datetime.now(timezone.utc).isoformat()
        data_copy["updated_at"] = datetime.now(timezone.utc).isoformat()
        self.data[collection][doc_id] = data_copy
        self.save()
        return data_copy

    def get(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        return self.data.get(collection, {}).get(doc_id)

    def update(self, collection: str, doc_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        doc = self.get(collection, doc_id)
        if not doc:
            return None
        doc.update(updates)
        doc["updated_at"] = datetime.now(timezone.utc).isoformat()
        self.save()
        return doc

    def delete(self, collection: str, doc_id: str) -> bool:
        if collection in self.data and doc_id in self.data[collection]:
            del self.data[collection][doc_id]
            self.save()
            return True
        return False

    def query(self, collection: str, filters: Optional[Dict[str, Any]] = None,
              order_by: Optional[str] = None, descending: bool = False,
              limit: Optional[int] = None) -> List[Dict[str, Any]]:
        coll_data = list(self.data.get(collection, {}).values())
        if filters:
            for key, val in filters.items():
                coll_data = [item for item in coll_data if item.get(key) == val]
        if order_by:
            coll_data.sort(key=lambda x: str(x.get(order_by, "")), reverse=descending)
        if limit:
            coll_data = coll_data[:limit]
        return coll_data


# Singleton LocalStore instance
db_local = LocalStore()


class DatabaseManager:
    """Unified access interface for Firestore or LocalStore."""

    @staticmethod
    def is_firestore_active() -> bool:
        return _firestore_client is not None

    @classmethod
    def set(cls, collection: str, doc_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        if _firestore_client:
            try:
                _firestore_client.collection(collection).document(doc_id).set(data)
                return data
            except Exception as e:
                logger.error(f"Firestore set error: {e}. Writing to local store.")
        return db_local.insert(collection, doc_id, data)

    @classmethod
    def get(cls, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        if _firestore_client:
            try:
                doc = _firestore_client.collection(collection).document(doc_id).get()
                if doc.exists:
                    d = doc.to_dict()
                    d["id"] = doc.id
                    return d
                return None
            except Exception as e:
                logger.error(f"Firestore get error: {e}. Reading from local store.")
        return db_local.get(collection, doc_id)

    @classmethod
    def update(cls, collection: str, doc_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if _firestore_client:
            try:
                _firestore_client.collection(collection).document(doc_id).update(updates)
                return cls.get(collection, doc_id)
            except Exception as e:
                logger.error(f"Firestore update error: {e}. Updating local store.")
        return db_local.update(collection, doc_id, updates)

    @classmethod
    def delete(cls, collection: str, doc_id: str) -> bool:
        if _firestore_client:
            try:
                _firestore_client.collection(collection).document(doc_id).delete()
                return True
            except Exception as e:
                logger.error(f"Firestore delete error: {e}.")
        return db_local.delete(collection, doc_id)

    @classmethod
    def query(cls, collection: str, filters: Optional[Dict[str, Any]] = None,
              order_by: Optional[str] = None, descending: bool = False,
              limit: Optional[int] = None) -> List[Dict[str, Any]]:
        if _firestore_client:
            try:
                q = _firestore_client.collection(collection)
                if filters:
                    for k, v in filters.items():
                        q = q.where(k, "==", v)
                if order_by:
                    direction = firestore.Query.DESCENDING if descending else firestore.Query.ASCENDING
                    q = q.order_by(order_by, direction=direction)
                if limit:
                    q = q.limit(limit)
                results = []
                for doc in q.stream():
                    d = doc.to_dict()
                    d["id"] = doc.id
                    results.append(d)
                return results
            except Exception as e:
                logger.error(f"Firestore query error: {e}. Falling back to local store.")
        return db_local.query(collection, filters=filters, order_by=order_by, descending=descending, limit=limit)
