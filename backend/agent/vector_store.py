import os
from pinecone import Pinecone, ServerlessSpec
from langchain_community.vectorstores import Pinecone as LangchainPinecone
from langchain_openai import OpenAIEmbeddings
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import Dict, Any, List, Optional
import asyncio
from dotenv import load_dotenv
import logging
from utils.url_tools import normalize_url

load_dotenv()
logger = logging.getLogger(__name__)

class VectorStoreManager:
    def __init__(self):
        try:
            required_env_vars = ["PINECONE_API_KEY", "OPENAI_API_KEY"]
            missing_vars = [var for var in required_env_vars if not os.getenv(var)]
            if missing_vars:
                raise ValueError(f"Missing required environment variables: {missing_vars}")

            self.pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
            self._index = None

            self.embedding_model = OpenAIEmbeddings(
                model="text-embedding-3-small",
                openai_api_key=os.getenv("OPENAI_API_KEY")
            )

            self.index_name = os.getenv("PINECONE_INDEX", "supplier-risk-analysis").lower()
            if not all(c.isalnum() or c == '-' for c in self.index_name):
                raise ValueError("Index name must contain only alphanumeric characters and hyphens")
            if not (3 <= len(self.index_name) <= 45):
                raise ValueError("Index name must be between 3 and 45 characters")

            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                separators=["\n\n", "\n", " ", ""]
            )

            logger.info("VectorStoreManager initialized successfully")
        except Exception as e:
            logger.error(f"VectorStoreManager initialization failed: {str(e)}", exc_info=True)
            raise

    async def initialize(self) -> "VectorStoreManager":
        try:
            existing_indexes = self.pc.list_indexes().names()
            if self.index_name not in existing_indexes:
                logger.info(f"Creating new index: {self.index_name}")
                await self._create_index()

            self._index = self.pc.Index(self.index_name)
            logger.info(f"Successfully connected to index: {self.index_name}")
            return self
        except Exception as e:
            logger.error(f"Failed to initialize vector store: {e}")
            raise

    async def _create_index(self):
        try:
            self.pc.create_index(
                name=self.index_name,
                dimension=1536,
                metric="cosine",
                spec=ServerlessSpec(
                    cloud="aws",
                    region="us-east-1"
                )
            )
            while not self.pc.describe_index(self.index_name).status['ready']:
                await asyncio.sleep(1)
            logger.info(f"Successfully created index: {self.index_name}")
        except Exception as e:
            logger.error(f"Failed to create index: {e}")
            raise

    async def store_documents(self, url: str, documents: List[Dict[str, Any]]) -> bool:
        from database import db
        max_retries = 3

        for attempt in range(max_retries):
            try:
                if not db.is_connected():
                    await db.connect()

                if not self._index:
                    await self.initialize()

                normalized_url = normalize_url(url)

                docs = []
                for doc in documents:
                    if not doc.get("content"):
                        continue

                    metadata_raw = {
                        "url": normalized_url,
                        "source": normalize_url(doc.get("source", normalized_url)) if doc.get("source") else normalized_url,
                        **doc.get("metadata", {})
                    }
                    # Convert all metadata to str
                    metadata = {k: (v.decode("utf-8") if isinstance(v, bytes) else str(v)) for k, v in metadata_raw.items()}

                    docs.append(
                        Document(
                            page_content=doc["content"],
                            metadata=metadata
                        )
                    )

                if not docs:
                    logger.warning(f"No valid documents to store for {normalized_url}")
                    return False

                split_docs = self.text_splitter.split_documents(docs)

                batch_size = 100
                for i in range(0, len(split_docs), batch_size):
                    batch = split_docs[i:i + batch_size]
                    LangchainPinecone.from_documents(
                        documents=batch,
                        embedding=self.embedding_model,
                        index_name=self.index_name,
                        namespace=normalized_url
                    )
                    await db.execute_raw("SELECT 1")

                logger.info(f"Successfully stored {len(split_docs)} chunks for {normalized_url}")
                return True

            except Exception as e:
                logger.error(f"Attempt {attempt + 1} failed: {str(e)}")
                if attempt == max_retries - 1:
                    return False
                await asyncio.sleep(2 ** attempt)
                continue

    async def similarity_search(
        self,
        url: str,
        query: str,
        k: int = 4,
        filter: Optional[Dict] = None
    ) -> List[Document]:
        try:
            if not self._index:
                raise ValueError("Vector store not initialized - call initialize() first")

            normalized_url = normalize_url(url)

            vectorstore = LangchainPinecone.from_existing_index(
                index_name=self.index_name,
                embedding=self.embedding_model,
                namespace=normalized_url
            )

            results = await asyncio.to_thread(
                vectorstore.similarity_search,
                query=query,
                k=k,
                filter=filter
            )

            # Convert all metadata fields to str
            sanitized = []
            for doc in results:
                meta = {k: (v.decode("utf-8") if isinstance(v, bytes) else str(v)) for k, v in doc.metadata.items()}
                sanitized.append(Document(page_content=doc.page_content, metadata=meta))

            return sanitized

        except Exception as e:
            logger.error(f"Similarity search failed for {url}: {e}")
            return []

    async def delete_namespace(self, url: str) -> bool:
        try:
            if not self._index:
                raise ValueError("Vector store not initialized - call initialize() first")

            normalized_url = normalize_url(url)

            await asyncio.to_thread(
                self._index.delete,
                delete_all=True,
                namespace=normalized_url
            )
            logger.info(f"Successfully deleted namespace {normalized_url}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete namespace {url}: {e}")
            return False

    async def get_stats(self) -> Dict[str, Any]:
        try:
            if not self._index:
                raise ValueError("Vector store not initialized - call initialize() first")

            stats = await asyncio.to_thread(
                self._index.describe_index_stats
            )
            return stats
        except Exception as e:
            logger.error(f"Failed to get index stats: {e}")
            return {}

    async def close(self):
        try:
            if self._index:
                self._index = None
            logger.info("Vector store resources released")
        except Exception as e:
            logger.error(f"Error during vector store cleanup: {e}")

async def get_vector_store() -> VectorStoreManager:
    try:
        store = VectorStoreManager()
        return await store.initialize()
    except Exception as e:
        logger.error(f"Failed to initialize vector store: {e}")
        raise RuntimeError(f"Vector store initialization failed: {str(e)}")
