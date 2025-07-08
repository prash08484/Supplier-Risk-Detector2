# backend/agent/async_graph.py

import json
import logging
from datetime import datetime
import asyncio
from typing import Dict, Any, List, Optional, TypedDict
from langchain_core.documents import Document
from utils.url_tools import normalize_url
from urllib.parse import urlparse

from database import db  # Importing the shared Prisma client

from agent.tools.firecrawl_tool import FirecrawlTool
from agent.tools.openai_tool import OpenAITool
from agent.vector_store import get_vector_store

logger = logging.getLogger(__name__)


class AgentState(TypedDict):
    url: str
    scraped_content: str
    analysis_result: Dict[str, Any]
    risk_score: float
    summary: str
    flags: List[str]
    error: str
    step: str


class AsyncSupplierRiskAgent:
    def __init__(self):
        self.firecrawl_tool = FirecrawlTool()
        self.openai_tool = OpenAITool()
        self.vector_store = None
        self.max_retries = 3
        self.retry_delay = 1

    async def initialize(self) -> "AsyncSupplierRiskAgent":
        for attempt in range(self.max_retries):
            try:
                if not self.vector_store:
                    self.vector_store = await get_vector_store()
                    logger.info("Vector store initialized successfully")
                return self
            except Exception as e:
                if attempt == self.max_retries - 1:
                    logger.error(
                        "Failed to initialize agent after %d attempts",
                        self.max_retries,
                        exc_info=True,
                    )
                    raise
                logger.warning(
                    "Agent initialization attempt %d failed, retrying...",
                    attempt + 1,
                )
                await asyncio.sleep(self.retry_delay * (attempt + 1))

    async def run_analysis(self, url: str) -> Dict[str, Any]:
        normalized_url = normalize_url(url)

        state: AgentState = {
            "url": normalized_url,
            "scraped_content": "",
            "analysis_result": {},
            "risk_score": 0.0,
            "summary": "",
            "flags": [],
            "error": "",
            "step": "initialized",
        }

        try:
            state = await self._execute_with_retry(self._scrape_content, state)
            state = await self._execute_with_retry(self._analyze_risks, state)
            state = await self._execute_with_retry(self._store_content, state)
            state = await self._execute_with_retry(self._generate_summary, state)
        except Exception as e:
            logger.error("Analysis workflow failed", exc_info=True)
            state["error"] = str(e)
            state["step"] = f"failed at {state.get('step')}"

        return self._format_result(state)

    async def answer_question(
        self, url: str, question: str, chat_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        try:
            if not question.strip():
                raise ValueError("Question cannot be empty")

            if not self.vector_store:
                await self.initialize()

            normalized_url = normalize_url(url)

            logger.info("Retrieving documents for URL: %s, Question: %s", normalized_url, question)
            documents = await self._retrieve_documents(normalized_url, question)

            context, sources = self._prepare_context(documents, normalized_url)
            logger.debug("Prepared context with %d sources", len(sources))

            messages = self._build_messages(context, question, chat_history)
            response = await self._get_llm_response(messages)

            return {
                "success": True,
                "answer": response,
                "sources": sources,
                "timestamp": datetime.now().isoformat(),
            }

        except Exception as e:
            logger.error("Question answering failed for %s", url, exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "answer": "I couldn't process your request. Please try again.",
                "sources": [normalize_url(url)] if url else [],
                "timestamp": datetime.now().isoformat(),
            }

    async def _execute_with_retry(self, func, state: AgentState) -> AgentState:
        for attempt in range(self.max_retries):
            try:
                return await func(state)
            except Exception as e:
                if attempt == self.max_retries - 1:
                    raise
                logger.warning(
                    "Attempt %d failed, retrying...", attempt + 1, exc_info=True
                )
                await asyncio.sleep(self.retry_delay * (attempt + 1))
        return state

    async def _retrieve_documents(self, url: str, question: str) -> List[Document]:
        search_terms = []

        if url:
            search_terms.append(url)

            normalized = normalize_url(url)
            if normalized != url:
                search_terms.append(normalized)

            parsed = urlparse(normalized)
            domain = f"{parsed.scheme}://{parsed.netloc}"
            if domain != normalized:
                search_terms.append(domain)

        for term in search_terms:
            try:
                documents = await self.vector_store.similarity_search(
                    url=term, query=question, k=5
                )
                if documents:
                    return documents
            except Exception as e:
                logger.debug(f"Search failed for {term}: {e}")

        return await self.vector_store.similarity_search(
            url=None, query=question, k=3
        )

    def _prepare_context(self, documents: List[Document], fallback_url: str) -> tuple[str, List[str]]:
        context_parts = []
        sources = set()

        for i, doc in enumerate(documents):
            source = normalize_url(doc.metadata.get("source", fallback_url))
            sources.add(source)
            context_parts.append(
                f"DOCUMENT {i + 1} (Source: {source}):\n{doc.page_content}"
            )
            logger.debug("Processed document from %s", source)

        return (
            "\n\n---\n\n".join(context_parts) if context_parts else "No relevant documents found",
            list(sources),
        )

    def _build_messages(
        self, context: str, question: str, chat_history: Optional[List[Dict[str, str]]]
    ) -> List[Dict[str, str]]:
        messages = [
            {
                "role": "system",
                "content": f"""You are a supplier risk analyst. Use this context:
{context}

Guidelines:
1. Be professional and factual
2. Cite sources when possible
3. If unsure, say so
4. For risk questions, highlight key factors""",
            }
        ]

        if chat_history:
            messages.extend(chat_history)

        messages.append({"role": "user", "content": question})
        return messages

    async def _get_llm_response(self, messages: List[Dict[str, str]]) -> str:
        try:
            return await self.openai_tool.get_chat_completion(
                messages=messages,
                model="gpt-4.1-mini",
            )
        except Exception as e:
            logger.error("LLM request failed", exc_info=True)
            return "I couldn't generate a response. Please try again later."

    async def _scrape_content(self, state: AgentState) -> AgentState:
        normalized_url = normalize_url(state["url"])
        logger.info(f"Scraping normalized URL: {normalized_url}")
        state["step"] = "scraping"

        try:
            scraped_data = await asyncio.to_thread(
                self.firecrawl_tool.scrape_website,
                normalized_url,
            )

            if not scraped_data or not scraped_data.get("success"):
                error = scraped_data.get("error", "Scraping failed with unknown error")
                raise ValueError(f"Scraping failed: {error}")

            state["scraped_content"] = scraped_data.get("content", "")
            logger.debug("Scraped %d characters", len(state["scraped_content"]))

        except Exception as e:
            state["error"] = f"Scraping error: {str(e)}"
            logger.error("Scraping failed for %s", normalized_url, exc_info=True)

        return state

    async def _analyze_risks(self, state: AgentState) -> AgentState:
        logger.info("Analyzing content for risks...")
        state["step"] = "analyzing"

        if not state["scraped_content"]:
            state["error"] = "No content to analyze"
            return state

        try:
            analysis_result = await asyncio.to_thread(
                self.openai_tool.analyze_supplier_risks,
                content=state["scraped_content"],
                prompt=self._create_analysis_prompt(state["scraped_content"]),
            )

            if not analysis_result or not analysis_result.get("success"):
                error = analysis_result.get("error", "Analysis failed with unknown error")
                raise ValueError(f"Analysis failed: {error}")

            parsed = self._parse_analysis_result(analysis_result["response"])
            state.update({
                "analysis_result": parsed,
                "risk_score": parsed.get("riskScore", 0.0),
                "flags": parsed.get("flags", []),
            })

        except Exception as e:
            state["error"] = f"Analysis error: {str(e)}"
            logger.error("Analysis failed", exc_info=True)

        return state

    async def _store_content(self, state: AgentState) -> AgentState:
        logger.info("Storing content in vector database...")
        state["step"] = "storing"

        if not state["scraped_content"]:
            state["error"] = "No content to store"
            return state

        try:
            stored = await self.vector_store.store_documents(
                normalize_url(state["url"]),
                [
                    {
                        "content": state["scraped_content"],
                        "source": normalize_url(state["url"]),
                        "metadata": {
                            "risk_score": state["risk_score"],
                            "flags": state["flags"],
                            "timestamp": datetime.now().isoformat(),
                        },
                    }
                ],
            )

            if not stored:
                raise ValueError("Document storage returned False")

            logger.info("Content stored successfully")

        except Exception as e:
            state["error"] = f"Storage error: {str(e)}"
            logger.error("Content storage failed", exc_info=True)

        return state

    async def _generate_summary(self, state: AgentState) -> AgentState:
        logger.info("Generating final summary...")
        state["step"] = "summarizing"

        if state.get("error"):
            return state

        try:
            summary_parts = []

            if state["analysis_result"]:
                risk_level = self._classify_risk_level(state["risk_score"])
                summary_parts.append(f"Risk Level: {risk_level}")

                if state["analysis_result"].get("summary"):
                    summary_parts.append(f"Key Findings: {state['analysis_result']['summary']}")

                if state["flags"]:
                    summary_parts.append(f"Risk Flags: {', '.join(state['flags'])}")

                summary_parts.append(f"Risk Score: {state['risk_score']}/10")

            state["summary"] = (
                " | ".join(summary_parts) if summary_parts else "No summary generated"
            )

        except Exception as e:
            state["error"] = f"Summary error: {str(e)}"
            logger.error("Summary generation failed", exc_info=True)

        return state

    def _create_analysis_prompt(self, content: str) -> str:
        return f"""
Analyze this supplier website content for risks:
{content[:12000]}

Provide JSON response with:
- summary: 2-3 sentence overview
- riskScore: 0-10 overall risk
- flags: list of specific risk factors
- categories: financial, compliance, esg, operational scores (0-10)
- recommendations: suggested actions

Example:
{{
    "summary": "...",
    "riskScore": 5.2,
    "flags": ["flag1", "flag2"],
    "categories": {{
        "financial": 4.5,
        "compliance": 6.2,
        "esg": 3.8,
        "operational": 5.0
    }},
    "recommendations": ["action1", "action2"]
}}
"""

    def _parse_analysis_result(self, response: str) -> Dict[str, Any]:
        try:
            if "```json" in response:
                json_str = response.split("```json")[1].split("```")[0].strip()
            else:
                json_str = response.strip()

            parsed = json.loads(json_str)

            if not all(key in parsed for key in ["summary", "riskScore", "flags"]):
                raise ValueError("Missing required analysis fields")

            return parsed

        except (json.JSONDecodeError, ValueError) as e:
            logger.warning("Failed to parse analysis result", exc_info=True)
            return {
                "summary": "Analysis completed with formatting issues",
                "riskScore": 5.0,
                "flags": ["Data Parsing Error"],
                "categories": {
                    "financial": 5.0,
                    "compliance": 5.0,
                    "esg": 5.0,
                    "operational": 5.0,
                },
                "recommendations": ["Review analysis manually"],
            }

    def _classify_risk_level(self, score: float) -> str:
        if score >= 8.0:
            return "CRITICAL RISK"
        elif score >= 6.0:
            return "HIGH RISK"
        elif score >= 4.0:
            return "MODERATE RISK"
        elif score >= 2.0:
            return "LOW RISK"
        else:
            return "MINIMAL RISK"

    def _format_result(self, state: AgentState) -> Dict[str, Any]:
        result = {
            "success": not bool(state["error"]),
            "url": normalize_url(state["url"]),
            "summary": state["summary"],
            "riskScore": state["risk_score"],
            "flags": state["flags"],
            "analysis": state.get("analysis_result", {}),
            "error": state.get("error"),
            "timestamp": datetime.now().isoformat(),
            "step": state.get("step", "completed"),
        }

        if state.get("error"):
            logger.error("Analysis failed at step: %s", state.get("step"))

        return result
