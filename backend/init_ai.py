"""
Script to pre-download the AI model and initialize the database.
Run this once before starting the server for faster first responses.
"""
import sys
import os

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

print("=" * 50)
print("Pathfinder AI Initialization Script")
print("=" * 50)
print()

print("[1/2] Initializing Pathfinder AI Pipeline...")
print("      This will download the model (~500MB) and build the vector store")
print()

from services.pipeline import Pipeline
pipeline = Pipeline()
print()
print("      ✅ Pipeline initialized successfully!")
print()

print("[2/2] Testing a query...")
response, places = pipeline.ask("What are the best beaches in Catanduanes?")
print(f"      Response: {response[:200]}...")
place_names = [p['name'] for p in places]
print(f"      Places found: {place_names}")
print()

print("=" * 50)
print("✅ AI Initialization Complete!")
print("   You can now start the server with: python run.py")
print("=" * 50)
