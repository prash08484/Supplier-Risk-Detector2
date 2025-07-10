from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from agent.async_graph import AsyncSupplierRiskAgent
from database import db
import logging
from datetime import datetime
import json
from typing import Optional, Dict, Any, List
import asyncio
from utils.url_tools import normalize_url  # ✅ import your normalizer
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

router = APIRouter()

class AnalyzeRequest(BaseModel):
    url: str
    include_links: bool = True
    max_depth: int = 2
    limit: int = 3  # 🔥 Add this

    @field_validator('url')
    def validate_and_normalize(cls, v):
        if v:
            return normalize_url(v)
        return v

def serialize_for_prisma(data: Any) -> Any:
    if data is None:
        return None
    elif isinstance(data, (str, int, float, bool)):
        return data
    elif isinstance(data, dict):
        return {k: serialize_for_prisma(v) for k, v in data.items()}
    elif isinstance(data, (list, tuple)):
        return [serialize_for_prisma(item) for item in data]
    elif isinstance(data, datetime):
        return data.isoformat()
    else:
        try:
            if hasattr(data, 'dict'):
                return serialize_for_prisma(data.dict())
            elif hasattr(data, '__dict__'):
                return serialize_for_prisma(data.__dict__)
        except Exception:
            pass
        return str(data)

async def save_supplier_data(url: str, agent_result: Dict[str, Any]) -> Optional[str]:
    max_retries = 3
    for attempt in range(max_retries):
        try:
            if not db.is_connected():
                await db.connect()

            normalized_url = normalize_url(url)

            analysis_data = serialize_for_prisma(agent_result.get("analysis", {}))
            flags = [str(flag) for flag in agent_result.get("flags", [])]
            risk_score = str(agent_result.get("riskScore", 0))
            summary = str(agent_result.get("summary", ""))
            company_name = extract_company_name_from_url(normalized_url)

            data = {
                "riskScore": risk_score,
                "summary": summary,
                "flags": flags,
                "analysisData": json.dumps(analysis_data) if analysis_data is not None else None
            }

            logger.debug(f"Attempting to save data: {data}")

            supplier_record = await db.supplier.upsert(
                where={"url": normalized_url},
                data={
                    "create": {
                        "url": normalized_url,
                        "name": company_name,
                        **data
                    },
                    "update": data
                }
            )
            return supplier_record.id

        except Exception as e:
            logger.error(f"Attempt {attempt + 1} failed to save supplier data: {e}", exc_info=True)
            if attempt == max_retries - 1:
                return None
            await asyncio.sleep(1)
            await db.disconnect()

    return None

@router.post("/analyze")
async def analyze_supplier(request: AnalyzeRequest):
    try:
        normalized_url = normalize_url(request.url)
        logger.info(f"Starting supplier analysis for: {normalized_url}")

        # ✅ Clamp values to API-safe bounds
        max_depth = min(max(request.max_depth, 1), 3)
        limit = min(max(request.limit, 1), 10)

        # Initialize and run agent
        agent = AsyncSupplierRiskAgent()
        await agent.initialize()

        agent_result = await agent.run_analysis(
            url=normalized_url,
            max_depth=max_depth,
            limit=limit
        )

        if not agent_result.get("success"):
            error_msg = agent_result.get("error", "Unknown error during analysis")
            logger.error(f"Agent analysis failed: {error_msg}")
            raise HTTPException(status_code=400, detail=f"Agent analysis failed: {error_msg}")

        # Save result to database
        record_id = await save_supplier_data(normalized_url, agent_result)
        if record_id:
            logger.info(f"Supplier record saved. ID: {record_id}")
        else:
            logger.warning("Continuing without saving to database")

        return format_analysis_response(normalized_url, agent_result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis endpoint failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

def format_analysis_response(url: str, agent_result: Dict[str, Any]) -> Dict[str, Any]:
    analysis = agent_result.get("analysis", {})
    return {
        "success": True,
        "data": {
            "company_name": extract_company_name_from_url(url),
            "analysis": {
                "sustainability_score": agent_result.get("riskScore", 0),
                "risk_level": classify_risk_level(agent_result.get("riskScore", 0)),
                "key_findings": agent_result.get("flags", []),
                "recommendations": analysis.get("recommendations", ["Monitor regularly"]),
                "categories": analysis.get("categories", {})
            },
            "content_summary": agent_result.get("summary", ""),
            "metadata": {
                "pages_analyzed": agent_result.get("pages_analyzed", 1),
                "last_updated": agent_result.get("timestamp", datetime.now().isoformat()),
                "url": normalize_url(url)
            }
        }
    }

def classify_risk_level(score: float) -> str:
    try:
        score = float(score)
    except (TypeError, ValueError):
        return "Unknown"
    if score >= 8.0:
        return "High"
    elif score >= 6.0:
        return "Medium-High"
    elif score >= 4.0:
        return "Medium"
    elif score >= 2.0:
        return "Low-Medium"
    return "Low"

def extract_company_name_from_url(url: str) -> str:
    try:
        normalized_url = normalize_url(url)
        parsed = urlparse(normalized_url)
        if not parsed.netloc:
            parsed = urlparse(f"//{normalized_url}")
        domain = parsed.netloc.replace('www.', '').split('.')[0]
        return domain.title() if domain else "Unknown Company"
    except Exception:
        return "Unknown Company"

@router.get("/suppliers")
async def get_suppliers(limit: int = 100, offset: int = 0):
    try:
        if not db.is_connected():
            await db.connect()

        suppliers = await db.supplier.find_many(
            skip=offset,
            take=limit,
            order_by={"createdAt": "desc"}
        )

        normalized_suppliers = []
        for supplier in suppliers:
            supplier_dict = supplier.dict()
            if supplier_dict.get('url'):
                supplier_dict['url'] = normalize_url(supplier_dict['url'])
            normalized_suppliers.append(supplier_dict)

        return {
            "success": True,
            "count": len(normalized_suppliers),
            "suppliers": normalized_suppliers
        }
    except Exception as e:
        logger.error(f"Failed to retrieve suppliers: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/supplier/{supplier_id}")
async def get_supplier(supplier_id: str):
    try:
        if not db.is_connected():
            await db.connect()

        supplier = await db.supplier.find_unique(
            where={"id": supplier_id},
            include={"chats": True}
        )

        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")

        supplier_dict = supplier.model_dump()
        if supplier_dict.get('url'):
            supplier_dict['url'] = normalize_url(supplier_dict['url'])

        if supplier_dict.get('chats'):
            for chat in supplier_dict['chats']:
                if chat.get('sources'):
                    chat['sources'] = [
                        normalize_url(src) if src else src
                        for src in chat['sources']
                    ]

        return {
            "success": True,
            "supplier": supplier_dict
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve supplier: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/db-ping")
async def db_ping():
    try:
        if not db.is_connected():
            await db.connect()
        await db.execute_raw("SELECT 1")
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Database ping failed: {e}", exc_info=True)
        return {"status": "error", "detail": str(e)}
