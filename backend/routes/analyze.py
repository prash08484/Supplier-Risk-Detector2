# backend/routes/analyze.py - Updated to use LangGraph agent

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.agent.graph import run_supplier_agent  # Import the agent
from backend.prisma.client import db
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter()

class AnalyzeRequest(BaseModel):
    url: str
    include_links: bool = True
    max_depth: int = 2

@router.post("/analyze")
async def analyze_supplier(request: AnalyzeRequest):
    '''
    Analyze supplier risk using LangGraph agent with Firecrawl scraping
    
    Args:
        request: Contains URL and scraping options
        
    Returns:
        Analysis results with risk score and summary
    '''
    try:
        logger.info(f"Starting supplier analysis for: {request.url}")
        
        # Step 1: Run the LangGraph agent
        agent_result = run_supplier_agent(request.url)
        
        if not agent_result["success"]:
            raise HTTPException(
                status_code=400,
                detail=f"Agent analysis failed: {agent_result.get('error', 'Unknown error')}"
            )
        
        # Step 2: Save/Update supplier in database
        try:
            supplier_record = await db.supplier.upsert(
                where={"url": request.url},
                data={
                    "create": {
                        "url": request.url,
                        "riskScore": str(agent_result["riskScore"]),
                        "summary": agent_result["summary"]
                    },
                    "update": {
                        "riskScore": str(agent_result["riskScore"]),
                        "summary": agent_result["summary"]
                    }
                }
            )
            logger.info(f"Supplier record saved. ID: {supplier_record.id}")
            
        except Exception as db_error:
            logger.warning(f"Database save failed: {db_error}. Continuing without saving.")
        
        # Step 3: Return formatted response for frontend
        return {
            "success": True,
            "data": {
                "company_name": extract_company_name_from_url(request.url),
                "analysis": {
                    "sustainability_score": agent_result["riskScore"],
                    "risk_level": classify_risk_level(agent_result["riskScore"]),
                    "key_findings": agent_result.get("flags", []),
                    "recommendations": agent_result.get("analysis", {}).get("recommendations", ["Monitor regularly"])
                },
                "content_summary": agent_result["summary"],
                "metadata": {
                    "pages_analyzed": 1,
                    "last_updated": agent_result.get("timestamp", "2024-01-01T00:00:00Z"),
                    "url": request.url
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

def classify_risk_level(score: float) -> str:
    """Classify risk level based on score (0-10 scale)"""
    if score >= 8.0:
        return "High"
    elif score >= 6.0:
        return "Medium-High"
    elif score >= 4.0:
        return "Medium"
    elif score >= 2.0:
        return "Low-Medium"
    else:
        return "Low"

def extract_company_name_from_url(url: str) -> str:
    """Extract company name from URL"""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        domain = parsed.netloc.replace('www.', '').split('.')[0]
        return domain.title()
    except:
        return "Unknown Company"

@router.get("/suppliers")
async def get_suppliers():
    '''Get all analyzed suppliers'''
    try:
        suppliers = await db.supplier.find_many(
            order_by={"createdAt": "desc"}
        )
        
        return {
            "success": True,
            "suppliers": suppliers
        }
        
    except Exception as e:
        logger.error(f"Failed to retrieve suppliers: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/supplier/{supplier_id}")
async def get_supplier(supplier_id: str):
    '''Get specific supplier by ID'''
    try:
        supplier = await db.supplier.find_unique(
            where={"id": supplier_id}
        )
        
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        
        return {
            "success": True,
            "supplier": supplier
        }
        
    except Exception as e:
        logger.error(f"Failed to retrieve supplier: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/db-ping")
async def db_ping():
    """Ping database to test live connection."""
    try:
        await db.execute_raw("SELECT 1")
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}