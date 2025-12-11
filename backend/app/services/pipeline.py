"""
Pathfinder AI Pipeline - RAG-based tourism assistant for Catanduanes
Uses sentence-transformers for embeddings with simple cosine similarity search
Compatible with Python 3.12+ including 3.14
"""
import json
import os
import re
import uuid
import time
import hashlib
import pickle
import math
from pathlib import Path
from typing import Optional

import numpy as np
import yaml
import requests
from dotenv import load_dotenv
from deep_translator import GoogleTranslator
from better_profanity import profanity
from sentence_transformers import SentenceTransformer
from loguru import logger


class SimpleVectorStore:
    """Simple in-memory vector store using cosine similarity"""
    
    def __init__(self, model_name: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"):
        logger.info(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        self.documents: list[dict] = []
        self.embeddings: Optional[np.ndarray] = None
        
    def add_documents(self, documents: list[str], metadatas: list[dict]):
        """Add documents with their metadata"""
        logger.info(f"Embedding {len(documents)} documents...")
        embeddings = self.model.encode(documents, show_progress_bar=True, convert_to_numpy=True)
        
        self.documents = [
            {"text": doc, "metadata": meta}
            for doc, meta in zip(documents, metadatas)
        ]
        self.embeddings = embeddings
        logger.info(f"Added {len(documents)} documents to vector store")
        
    def query(self, query_text: str, n_results: int = 3) -> dict:
        """Query the vector store using cosine similarity"""
        if self.embeddings is None or len(self.documents) == 0:
            return {"documents": [[]], "metadatas": [[]], "distances": [[]]}
        
        # Encode query
        query_embedding = self.model.encode([query_text], convert_to_numpy=True)[0]
        
        # Compute cosine similarity
        similarities = np.dot(self.embeddings, query_embedding) / (
            np.linalg.norm(self.embeddings, axis=1) * np.linalg.norm(query_embedding)
        )
        
        # Convert similarity to distance (lower is better, like ChromaDB)
        distances = 1 - similarities
        
        # Get top n results
        top_indices = np.argsort(distances)[:n_results]
        
        return {
            "documents": [[self.documents[i]["text"] for i in top_indices]],
            "metadatas": [[self.documents[i]["metadata"] for i in top_indices]],
            "distances": [[distances[i] for i in top_indices]]
        }
    
    def save(self, path: str):
        """Save the vector store to disk"""
        data = {
            "documents": self.documents,
            "embeddings": self.embeddings
        }
        with open(path, 'wb') as f:
            pickle.dump(data, f)
        logger.info(f"Saved vector store to {path}")
            
    def load(self, path: str) -> bool:
        """Load the vector store from disk"""
        try:
            with open(path, 'rb') as f:
                data = pickle.load(f)
            self.documents = data["documents"]
            self.embeddings = data["embeddings"]
            logger.info(f"Loaded vector store from {path} ({len(self.documents)} documents)")
            return True
        except Exception as e:
            logger.warning(f"Could not load vector store: {e}")
            return False


class Pipeline:
    def __init__(self, dataset_path: str = None, db_path: str = None, config_path: str = None):
        """
        Initialize the Pathfinder AI Pipeline.
        
        Args:
            dataset_path: Path to dataset.json
            db_path: Path for vector store storage
            config_path: Path to config.yaml
        """
        # Get base directory (backend/app/services)
        base_dir = Path(__file__).parent
        app_dir = base_dir.parent
        
        # Set default paths relative to app directory
        if dataset_path is None:
            dataset_path = str(app_dir / "data" / "dataset.json")
        if db_path is None:
            db_path = str(app_dir / "data" / "vector_store")
        if config_path is None:
            config_path = str(app_dir / "data" / "config.yaml")
        
        self.db_path = db_path
        self.config = self.load_config(config_path)
        logger.info(f"Loaded config: {self.config['system']['welcome_message']}")
        
        load_dotenv()
        
        # Internet tracking
        self.internet_status = None
        self.last_internet_check = 0
        
        # Setup Gemini
        self.setup_gemini()
        
        # Setup profanity filter
        profanity.load_censor_words()
        profanity.add_censor_words(self.config.get('profanity', []))
        
        # Initialize vector store
        self.vector_store = SimpleVectorStore()
        
        # Check if we need to rebuild the database
        os.makedirs(db_path, exist_ok=True)
        vector_store_file = os.path.join(db_path, "store.pkl")
        hash_file = os.path.join(db_path, "dataset_hash.txt")
        
        current_hash = self.dataset_hash(dataset_path)
        stored_hash = None
        
        if os.path.exists(hash_file):
            with open(hash_file, 'r') as f:
                stored_hash = f.read().strip()
        
        # Load existing store or rebuild
        if stored_hash == current_hash and os.path.exists(vector_store_file):
            if self.vector_store.load(vector_store_file):
                logger.info("Loaded existing vector store")
            else:
                self._build_vector_store(dataset_path, vector_store_file, hash_file, current_hash)
        else:
            self._build_vector_store(dataset_path, vector_store_file, hash_file, current_hash)
    
    def _build_vector_store(self, dataset_path: str, vector_store_file: str, hash_file: str, current_hash: str):
        """Build the vector store from dataset"""
        logger.info("Building vector store from dataset...")
        self.load_dataset(dataset_path)
        self.vector_store.save(vector_store_file)
        
        # Save hash
        with open(hash_file, 'w') as f:
            f.write(current_hash)
        logger.info("Vector store built successfully")

    def load_config(self, config_path: str) -> dict:
        """Load configuration from YAML file."""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            logger.error(f"Config file not found: {config_path}")
            raise RuntimeError(f"Config file not found: {config_path}")
        except yaml.YAMLError as e:
            logger.error(f"Invalid YAML in config: {e}")
            raise RuntimeError(f"Invalid YAML in config: {e}")

    def dataset_hash(self, dataset_path: str) -> str | None:
        """Generate MD5 hash of dataset for change detection."""
        hasher = hashlib.md5()
        try:
            with open(dataset_path, 'rb') as f:
                buf = f.read()
                hasher.update(buf)
            return hasher.hexdigest()
        except FileNotFoundError:
            return None
    
    def setup_gemini(self):
        """Setup Google Gemini for natural language generation."""
        try:
            import google.generativeai as genai
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                logger.warning("GEMINI_API_KEY not found in environment")
                self.has_gemini = False
                return
            
            genai.configure(api_key=api_key)
            self.gemini = genai.GenerativeModel(self.config['gemini']['model_name'])
            self.has_gemini = True
            logger.info("Gemini setup successful")
        except Exception as e:
            logger.warning(f"Gemini setup failed: {e}")
            self.has_gemini = False

    def load_dataset(self, dataset_path: str):
        """Load Q&A dataset into vector store."""
        try:
            with open(dataset_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except FileNotFoundError:
            logger.error(f"Dataset not found: {dataset_path}")
            raise RuntimeError(f"Dataset not found: {dataset_path}")
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in dataset: {e}")
            raise RuntimeError(f"Invalid JSON in dataset: {e}")

        documents = []
        metadatas = []

        for idx, item in enumerate(data):
            if 'input' not in item or 'output' not in item:
                logger.warning(f"Skipping invalid entry at index {idx}")
                continue
                
            documents.append(item['input'])
            metadatas.append({
                "question": item['input'],
                "answer": item['output'],
                "title": item.get('title', 'General Info'),
                "topic": item.get('topic', 'General'),
                "summary_offline": item.get('summary_offline', item['output'])
            })

        self.vector_store.add_documents(documents, metadatas)
        logger.info(f"Loaded {len(documents)} Q&A pairs into vector store")

    def checkint(self) -> bool:
        """Check internet connectivity with caching."""
        current_time = time.time()
        
        if self.internet_status is not None and \
           (current_time - self.last_internet_check) < self.config['internet']['cache_duration']:
            return self.internet_status
        
        try:
            requests.get(
                self.config['internet']['test_url'],
                timeout=self.config['internet']['timeout']
            )
            self.internet_status = True
        except (requests.ConnectionError, requests.Timeout):
            self.internet_status = False
        
        self.last_internet_check = current_time
        return self.internet_status
        
    def extract_keywords(self, question: str) -> list[str]:
        """Extract topic keywords from question."""
        found = []
        question_lower = question.lower()
        
        for topic, words in self.config.get('keywords', {}).items():
            for word in words:
                pattern = r'\b' + re.escape(word) + r'\b'
                if re.search(pattern, question_lower):
                    found.append(topic)
                    break
        
        return found if found else ['general']
        
    def protect(self, user_input: str) -> str:
        """Protect place names during translation."""
        temp = user_input
        markers = {}

        for place_name in self.config.get('protected_places', []):
            if place_name.lower() in temp.lower():
                marker = f"__PLACE_{uuid.uuid4().hex[:8]}__"
                temp = re.sub(
                    re.escape(place_name),
                    marker,
                    temp,
                    flags=re.IGNORECASE,
                    count=1
                )
                markers[marker] = place_name

        # Translate the rest
        try:
            temp = GoogleTranslator(source='auto', target='en').translate(temp)
            logger.debug(f"Translated: '{user_input}' → '{temp}'")
        except Exception as e:
            logger.debug(f"Translation failed: {e}")

        # Restore place names
        for marker, place_input in markers.items():
            temp = temp.replace(marker, place_input)

        return temp

    def search_multi_topic(self, topics: list[str], translated_query: str, results_per_topic: int = 1) -> list[str]:
        """Search vector store for multiple topics."""
        all_results = []
        seen_texts = set()  # Track seen texts to prevent duplicates
        n_results = self.config['rag']['search_results']

        for topic in topics:
            logger.debug(f"Searching for topic: '{topic}'")

            results = self.vector_store.query(topic, n_results=n_results)

            if not results['documents'][0]:
                logger.debug(f"No results found for topic: {topic}")
                continue
            
            topic_results = []
            for i, metadata in enumerate(results['metadatas'][0]):
                confidence = results['distances'][0][i]
                logger.debug(f"Result {i+1} for '{topic}': confidence={confidence:.3f}")

                if confidence <= self.config['rag']['multi_topic_threshold']:
                    text = metadata.get('summary_offline', metadata['answer'])
                    text_normalized = text.strip().lower()
                    # Only add if we haven't seen this text before
                    if text_normalized not in seen_texts:
                        topic_results.append({
                            'text': text,
                            'confidence': confidence,
                            'topic': topic
                        })
                        seen_texts.add(text_normalized)

            topic_results.sort(key=lambda x: x['confidence'])
            selected = topic_results[:results_per_topic]
            all_results.extend(selected)

        return [r['text'] for r in all_results]
    
    def _are_answers_similar(self, answer1: str, answer2: str, threshold: float = 0.85) -> bool:
        """
        Check if two answers are semantically similar using word overlap.
        Returns True if they are similar enough to be considered duplicates.
        """
        # Normalize both answers
        words1 = set(answer1.lower().strip().split())
        words2 = set(answer2.lower().strip().split())
        
        # Remove common stop words for better comparison
        stop_words = {'is', 'a', 'an', 'the', 'in', 'at', 'on', 'for', 'to', 'of', 'and', 'or', 'but', 'it', 'its'}
        words1 = words1 - stop_words
        words2 = words2 - stop_words
        
        if not words1 or not words2:
            return False
        
        # Calculate Jaccard similarity (intersection over union)
        intersection = len(words1 & words2)
        union = len(words1 | words2)
        similarity = intersection / union if union > 0 else 0
        
        return similarity >= threshold
    
    def search(self, question: str) -> str:
        """Search for single question."""
        logger.debug(f"Searching for: '{question}'")
        
        results = self.vector_store.query(question, n_results=self.config['rag']['search_results'])
        
        if not results['documents'][0]:
            return "I don't have information about that. Ask about beaches, food, or activities!"
        
        good_answers = []
        seen_answers = set()  # Track seen answers to prevent exact duplicates
        
        for i, metadata in enumerate(results['metadatas'][0]):
            confidence = results['distances'][0][i]
            if confidence <= self.config['rag']['confidence_threshold']:
                answer = metadata['answer']
                # Normalize answer for exact comparison (strip whitespace, lower)
                answer_normalized = answer.strip().lower()
                
                # Check for exact duplicate
                if answer_normalized in seen_answers:
                    continue
                
                # Check for semantic similarity with existing answers
                is_similar = False
                for existing_answer in good_answers:
                    if self._are_answers_similar(answer, existing_answer):
                        is_similar = True
                        logger.debug(f"Skipping similar answer (similarity detected)")
                        break
                
                if not is_similar:
                    good_answers.append(answer)
                    seen_answers.add(answer_normalized)
                    logger.debug(f"Match {i+1} confidence: {confidence:.3f}")
        
        if not good_answers:
            return "I'm not sure about that. Can you rephrase or ask about Catanduanes tourism?"
        
        # If we have multiple answers, prefer the first (most relevant) one
        # Or combine them intelligently
        if len(good_answers) > 1:
            # Return only the first (most relevant) answer to avoid repetition
            return good_answers[0]
        
        return " ".join(good_answers)

    def make_natural(self, question: str, fact: str) -> str:
        """Make response natural using Gemini or fallback."""
        
        if self.has_gemini and self.checkint():
            try:
                prompt = self.config['gemini']['prompt_template'].format(
                    question=question,
                    fact=fact
                )
                logger.debug(f"Facts being sent to Gemini: {fact}")
                
                response = self.gemini.generate_content(prompt)
                response_text = response.text
                
                # Remove duplicate sentences from Gemini response
                response_text = self._deduplicate_sentences(response_text)
                
                return response_text
                
            except Exception as e:
                logger.debug(f"Gemini error: {e}")

        if "don't have information" in fact.lower() or "not sure" in fact.lower():
            off_msg = self.config['offline']['off_message']
            return off_msg.format(fact=fact)
        
        backup = self.config['offline']['backup']
        response_text = backup.format(fact=fact)
        # Also deduplicate offline responses
        response_text = self._deduplicate_sentences(response_text)
        return response_text
    
    def _deduplicate_sentences(self, text: str) -> str:
        """Remove duplicate sentences from text."""
        # Split by common sentence endings, preserving the endings
        sentences = re.split(r'([.!?]+)', text)
        
        # Recombine sentences with their punctuation
        combined = []
        for i in range(0, len(sentences) - 1, 2):
            if i + 1 < len(sentences):
                combined.append(sentences[i] + sentences[i + 1])
            else:
                combined.append(sentences[i])
        
        # Remove duplicates while preserving order
        seen = set()
        unique_sentences = []
        for sentence in combined:
            sentence_normalized = sentence.strip().lower()
            if sentence_normalized and sentence_normalized not in seen:
                unique_sentences.append(sentence)
                seen.add(sentence_normalized)
        
        # Join sentences with space
        return ' '.join(unique_sentences).strip()
    
    def key_places(self, facts: str) -> list[str]:
        """Extract places from facts using word boundary matching."""
        places = self.config.get('places', {})
        found_places = []
        facts_lower = facts.lower()
        
        # Sort by length (longest first) to match "Twin Rock Beach" before "Twin Rock"
        sorted_places = sorted(places, key=len, reverse=True)
        
        for place in sorted_places:
            place_lower = place.lower()
            # Use word boundary regex for exact word matching
            # This prevents partial matches like "rock" matching "lighthouse"
            pattern = r'\b' + re.escape(place_lower) + r'\b'
            if re.search(pattern, facts_lower) and place not in found_places:
                found_places.append(place)
                logger.debug(f"Found place in facts: {place}")

        return found_places
    
    def calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two coordinates in kilometers using Haversine formula."""
        R = 6371  # Earth radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lng = math.radians(lng2 - lng1)
        
        a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    def get_place_data(self, found_places: list[str], reference_place: str = None, max_distance_km: float = 20.0) -> list[dict]:
        """Get full place data with coordinates, optionally filtered by proximity to a reference place."""
        places_data = []

        # Get reference coordinates if a place is mentioned
        ref_lat = None
        ref_lng = None
        if reference_place and reference_place in self.config.get('places', {}):
            ref_info = self.config['places'][reference_place]
            ref_lat = ref_info['lat']
            ref_lng = ref_info['lng']

        for place_name in found_places:
            if place_name in self.config.get('places', {}):
                place_info = self.config['places'][place_name]
                place_lat = place_info['lat']
                place_lng = place_info['lng']
                
                # Filter by distance if reference place is provided
                if ref_lat is not None and ref_lng is not None:
                    distance = self.calculate_distance(ref_lat, ref_lng, place_lat, place_lng)
                    if distance > max_distance_km:
                        logger.debug(f"Filtered out {place_name} - {distance:.1f}km from {reference_place}")
                        continue
                
                places_data.append({
                    "name": place_name,
                    "lat": place_lat,
                    "lng": place_lng,
                    "type": place_info['type']
                })
        return places_data
    
    def check_profanity(self, text: str) -> bool:
        """Check for profanity in text."""
        return profanity.contains_profanity(text)
        
    def ask(self, user_input: str) -> tuple[str, list[dict]]:
        """
        Main ask function with multi-topic support and natural responses.
        
        Returns:
            tuple: (natural_response: str, places: list[dict])
        """
        if self.check_profanity(user_input):
            return (
                "I am unable to process that language. Please ask your question politely so I can assist you with Catanduanes tourism.",
                []
            )
        
        # Preprocess and Translate Input
        convert = self.protect(user_input)
        
        # Extract keywords
        topics = self.extract_keywords(convert)
        logger.debug(f"Detected topics: {topics}")
        
        # Get facts from RAG
        if len(topics) > 1 and topics != ['general']:
            results_per_topic = self.config['rag'].get('results_per_topic', 3)
            answers = self.search_multi_topic(topics, convert, results_per_topic)
            fact = " ".join(answers) if answers else "I don't have info about those topics"
        else:
            fact = self.search(convert)

        # First, check if user's query directly mentions a place name
        # This should take priority over places found in the facts
        user_lower = user_input.lower()
        directly_mentioned_places = []
        all_places = list(self.config.get('places', {}).keys())
        
        # Sort by length (longest first) to match "Twin Rock Beach" before "Twin Rock"
        sorted_places = sorted(all_places, key=len, reverse=True)
        
        for place_name in sorted_places:
            place_lower = place_name.lower()
            # Check if place is directly mentioned in user query
            # Use word boundaries for better matching (e.g., "bote lighthouse" should match "Bote Lighthouse")
            # Escape special regex characters and use word boundaries
            pattern = r'\b' + re.escape(place_lower) + r'\b'
            if re.search(pattern, user_lower):
                directly_mentioned_places.append(place_name)
                logger.debug(f"Place directly mentioned in query: {place_name}")
        
        # Extract places from the retrieved fact
        place_names_from_fact = self.key_places(fact)
        
        # Prioritize places mentioned in user query
        if directly_mentioned_places:
            # Use directly mentioned places, but also include fact places if they match
            place_names = directly_mentioned_places
            # Add fact places that weren't already included
            for fact_place in place_names_from_fact:
                if fact_place not in place_names:
                    place_names.append(fact_place)
        else:
            # No direct mention, use places from facts
            place_names = place_names_from_fact
        
        # Check if user is asking about places "near" a specific location
        reference_place = None
        near_keywords = ['near', 'close to', 'around', 'by', 'next to']
        
        # Check if query mentions a place with "near" keywords
        for place_name in all_places:
            place_lower = place_name.lower()
            # Check if place is mentioned and query has "near" keywords
            if place_lower in user_lower:
                for keyword in near_keywords:
                    if keyword in user_lower:
                        # Check if keyword appears before or after the place name
                        place_idx = user_lower.find(place_lower)
                        keyword_idx = user_lower.find(keyword)
                        if abs(place_idx - keyword_idx) < 30:  # Within 30 chars
                            reference_place = place_name
                            logger.debug(f"Detected proximity query: places near {reference_place}")
                            break
                if reference_place:
                    break
        
        # Check if error message
        if "don't have information" in fact.lower() or "not sure" in fact.lower():
            return (fact, [])
        
        # Make it natural
        natural_response = self.make_natural(user_input, fact)
        
        # Get full place data (with proximity filtering if applicable)
        places = self.get_place_data(place_names, reference_place=reference_place)
        
        return (natural_response, places)

    def get_all_places(self) -> list[dict]:
        """Get all available places for the map."""
        all_places = self.config.get('places', {})
        return [
            {
                "name": name,
                "lat": data['lat'],
                "lng": data['lng'],
                "type": data['type']
            }
            for name, data in all_places.items()
        ]
