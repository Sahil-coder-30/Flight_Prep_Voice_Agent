import os
import re
import time
import requests
from pypdf import PdfReader
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance

# ── Env Setup ──────────────────────────────────────────────────────────────────
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "atc_phraseology")
PDF_PATH = os.getenv("PDF_PATH", os.path.join(os.path.dirname(__file__), "../../helpers/PCG_Bsc_w_Chg_1_2_and_3_dtd_7-9-26 (2).pdf"))

print("========================================================================")
print("  FAA PILOT/CONTROLLER GLOSSARY (PCG) — QDRANT RAG INGESTION SCRIPT    ")
print("========================================================================\n")

if not os.path.exists(PDF_PATH):
    print(f"Error: File not found at {PDF_PATH}")
    exit(1)

# 1. Initialize Qdrant Client
client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY if QDRANT_API_KEY else None)

# 2. Ensure Collection Exists
collections = [c.name for c in client.get_collections().collections]
if COLLECTION_NAME not in collections:
    print(f"Creating collection '{COLLECTION_NAME}' with 1024-dim Cosine vectors...")
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=1024, distance=Distance.COSINE),
    )
else:
    print(f"Collection '{COLLECTION_NAME}' exists in Qdrant.")

# 3. Read PDF and Extract Text
reader = PdfReader(PDF_PATH)
num_pages = len(reader.pages)
print(f"Extracted {num_pages} pages from PDF.")

full_text = ""
for i, page in enumerate(reader.pages):
    t = page.extract_text() or ""
    full_text += f"\n--- Page {i+1} ---\n" + t

# 4. Chunk Text into Meaningful Passages
chunks = []
# Split by major glossary entries (e.g. ALL CAPS headings followed by hyphen or definition)
paragraphs = re.split(r'\n(?=[A-Z0-9\s\-\/\(\)]{3,60}\s*[\−\-])', full_text)

print(f"Parsed {len(paragraphs)} raw glossary paragraphs.")

for p in paragraphs:
    clean = p.strip()
    clean = re.sub(r'\s+', ' ', clean)
    if len(clean) < 30:
        continue
    
    # Sub-chunk large paragraphs to ~500 chars
    if len(clean) > 700:
        for j in range(0, len(clean), 500):
            sub = clean[j:j+600].strip()
            if len(sub) > 40:
                chunks.append(sub)
    else:
        chunks.append(clean)

print(f"Created {len(chunks)} text chunks for embedding.\n")

# 5. Embed & Upsert into Qdrant in Batches
BATCH_SIZE = 16
total_upserted = 0
t_start = time.time()

for i in range(0, len(chunks), BATCH_SIZE):
    batch_texts = chunks[i : i + BATCH_SIZE]
    
    # Call Mistral Embedding API
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
        
        # Prepare Qdrant Points
        points = []
        for idx, (txt, vec) in enumerate(zip(batch_texts, embeddings)):
            point_id = 5000 + i + idx  # offset IDs to prevent overwriting existing steps
            points.append(
                PointStruct(
                    id=point_id,
                    vector=vec,
                    payload={
                        "text": txt,
                        "source": "FAA_Pilot_Controller_Glossary_PCG",
                        "authority": "FAA / ICAO",
                        "type": "glossary_term"
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
print(f"  INGESTION COMPLETE: {total_upserted} PCG VECTORS UPSERTED TO QDRANT ({time.time() - t_start:.2f}s)")
print("========================================================================\n")
