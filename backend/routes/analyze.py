from fastapi import APIRouter, Request, HTTPException
from backend.agent.graph import run_supplier_agent
from backend.prisma.client import db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/analyze")
async def analyze_supplier(request: Request, url: str):
    '''
    Analyze supplier risk using the LangGraph agent
    
    Args:
        url: Supplier website URL to analyze
        
    Returns:
        Analysis results with risk score and summary
    '''
    try:
        logger.info(f"Starting supplier analysis for: {url}")
        
        # Step 1: Run the LangGraph agent
        result = run_supplier_agent(url)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=400, 
                detail=f"Analysis failed: {result.get('error', 'Unknown error')}"
            )
        
        # Step 2: Save result to database
        analysis_record = await db.supplieranalysis.create(
            data={
                "url": url,
                "summary": result["summary"],
                "riskScore": result["riskScore"],
                "flags": result["flags"],
                "analysisData": result.get("analysis", {}),
                "userId": "sample-user-id",  # Replace with actual user ID
                "createdAt": result["timestamp"]
            }
        )
        
        logger.info(f"Analysis completed successfully. ID: {analysis_record.id}")
        
        return {
            "success": True,
            "analysisId": analysis_record.id,
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Analysis endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analysis/{analysis_id}")
async def get_analysis(analysis_id: str):
    '''Get stored analysis results by ID'''
    try:
        analysis = await db.supplieranalysis.find_unique(
            where={"id": analysis_id}
        )
        
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        return {
            "success": True,
            "analysis": analysis
        }
        
    except Exception as e:
        logger.error(f"Failed to retrieve analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))