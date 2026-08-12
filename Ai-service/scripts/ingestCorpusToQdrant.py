import os
import json
import time
import requests
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "atc_phraseology")
JSON_PATH = os.path.join(os.path.dirname(__file__), "../../helpers/extracted_pilot_atc_corpus_chunks.json")

print("========================================================================")
print("  PILOT-ATC COMMUNICATIONS CORPUS — QDRANT RAG INGESTION SCRIPT         ")
print("========================================================================\n")

if not os.path.exists(JSON_PATH):
    print(f"Error: File not found at {JSON_PATH}")
    exit(1)

client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY if QDRANT_API_KEY else None)

collections = [c.name for c in client.get_collections().collections]
if COLLECTION_NAME not in collections:
    print(f"Creating collection '{COLLECTION_NAME}' with 1024-dim Cosine vectors...")
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=1024, distance=Distance.COSINE),
    )
else:
    print(f"Collection '{COLLECTION_NAME}' exists in Qdrant.")

with open(JSON_PATH, "r") as f:
    chunks = json.load(f)

print(f"Loaded {len(chunks)} corpus chunks for Qdrant ingestion.")

BATCH_SIZE = 16
total_upserted = 0
t_start = time.time()

for i in range(0, len(chunks), BATCH_SIZE):
    batch = chunks[i : i + BATCH_SIZE]
    batch_texts = [c["text"] for c in batch]

    try:
        res = requests.post(
            "https://api.mistral.ai/v1/embeddings",
            headers={
                "Authorization": f"Bearer {MISTRAL_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "mistral-embed",
                "input": batch_texts
            },
            timeout=30
        )

        if res.status_code != 200:
            print(f"Batch {i//BATCH_SIZE + 1} embedding failed: {res.status_code} {res.text}")
            time.sleep(2)
            continue

        data = res.json()
        embeddings = [item["embedding"] for item in data["data"]]

        points = []
        for idx, (chunk, vec) in enumerate(zip(batch, embeddings)):
            point_id = 10000 + chunk["conversation_id"]
            points.append(
                PointStruct(
                    id=point_id,
                    vector=vec,
                    payload={
                        "text": chunk["text"],
                        "authority": chunk["authority"],
                        "phase": chunk["phase"],
                        "procedure_type": chunk["procedure_type"],
                        "conversation_id": chunk["conversation_id"],
                        "category": chunk["category"],
                        "filename": chunk["filename"],
                        "type": "conversation_corpus"
                    }
                )
            )

        client.upsert(collection_name=COLLECTION_NAME, points=points)
        total_upserted += len(points)
        print(f"   ✓ Batch {i//BATCH_SIZE + 1}/{(len(chunks) + BATCH_SIZE - 1)//BATCH_SIZE} upserted {len(points)} points into Qdrant.")
        time.sleep(0.1)

    except Exception as err:
        print(f"   ✖ Batch {i//BATCH_SIZE + 1} Error:", str(err))

print(f"\n========================================================================")
print(f"  INGESTION COMPLETE: {total_upserted} CORPUS VECTORS UPSERTED TO QDRANT ({time.time() - t_start:.2f}s)")
print("========================================================================\n")
