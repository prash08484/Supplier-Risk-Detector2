# backend/agent/graph.py
from typing import Dict, Any, List, TypedDict
from langgraph.graph import StateGraph, END
# from langgraph.prebuilt.tool_executor import ToolExecutor, ToolInvocation

import json
import logging
from datetime import datetime

# Import your custom tools
from backend.agent.tools.firecrawl_tool import FirecrawlTool
from backend.agent.tools.openai_tool import OpenAITool

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AgentState(TypedDict):
    """State shared across all agent nodes"""
    url: str
    scraped_content: str
    analysis_result: Dict[str, Any]
    risk_score: float
    summary: str
    flags: List[str]
    error: str
    step: str

class SupplierRiskAgent:
    """
    Supplier Risk Detector Agent using LangGraph
    
    This agent orchestrates the process of:
    1. Scraping supplier websites
    2. Analyzing content for risks
    3. Generating structured risk assessments
    """
    
    def __init__(self):
        self.firecrawl_tool = FirecrawlTool()
        self.openai_tool = OpenAITool()
        
        # Create the graph
        self.workflow = self._create_workflow()
        self.app = self.workflow.compile()
    
    def _create_workflow(self) -> StateGraph:
        """Create the LangGraph workflow"""
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("scrape_content", self._scrape_content_node)
        workflow.add_node("analyze_risks", self._analyze_risks_node)
        workflow.add_node("generate_summary", self._generate_summary_node)
        workflow.add_node("handle_error", self._handle_error_node)
        
        # Define the flow
        workflow.set_entry_point("scrape_content")
        
        # Add conditional edges
        workflow.add_conditional_edges(
            "scrape_content",
            self._should_continue_after_scraping,
            {
                "continue": "analyze_risks",
                "error": "handle_error"
            }
        )
        
        workflow.add_conditional_edges(
            "analyze_risks",
            self._should_continue_after_analysis,
            {
                "continue": "generate_summary",
                "error": "handle_error"
            }
        )
        
        workflow.add_edge("generate_summary", END)
        workflow.add_edge("handle_error", END)
        
        return workflow
    
    def _scrape_content_node(self, state: AgentState) -> AgentState:
        """Node to scrape supplier website content"""
        logger.info(f"Scraping content from: {state['url']}")
        
        try:
            state["step"] = "scraping"
            scraped_data = self.firecrawl_tool.scrape_website(state["url"])
            
            if scraped_data and scraped_data.get("success"):
                state["scraped_content"] = scraped_data.get("content", "")
                logger.info(f"Successfully scraped {len(state['scraped_content'])} characters")
            else:
                state["error"] = f"Failed to scrape website: {scraped_data.get('error', 'Unknown error')}"
                
        except Exception as e:
            state["error"] = f"Scraping error: {str(e)}"
            logger.error(f"Scraping failed: {e}")
        
        return state
    
    def _analyze_risks_node(self, state: AgentState) -> AgentState:
        """Node to analyze scraped content for risks"""
        logger.info("Analyzing content for risks...")
        
        try:
            state["step"] = "analyzing"
            
            # Prepare analysis prompt
            analysis_prompt = self._create_analysis_prompt(state["scraped_content"])
            
            # Get analysis from OpenAI
            analysis_result = self.openai_tool.analyze_supplier_risks(
                content=state["scraped_content"],
                prompt=analysis_prompt
            )
            
            if analysis_result and analysis_result.get("success"):
                parsed_result = self._parse_analysis_result(analysis_result["response"])
                state["analysis_result"] = parsed_result
                state["risk_score"] = parsed_result.get("riskScore", 0.0)
                state["flags"] = parsed_result.get("flags", [])
            else:
                state["error"] = f"Analysis failed: {analysis_result.get('error', 'Unknown error')}"
                
        except Exception as e:
            state["error"] = f"Analysis error: {str(e)}"
            logger.error(f"Analysis failed: {e}")
        
        return state
    
    def _generate_summary_node(self, state: AgentState) -> AgentState:
        """Node to generate final summary and structure output"""
        logger.info("Generating final summary...")
        
        try:
            state["step"] = "summarizing"
            
            # Create comprehensive summary
            summary_parts = []
            
            if state.get("analysis_result"):
                analysis = state["analysis_result"]
                
                # Risk level classification
                risk_level = self._classify_risk_level(state["risk_score"])
                summary_parts.append(f"Risk Level: {risk_level}")
                
                # Main findings
                if analysis.get("summary"):
                    summary_parts.append(f"Analysis: {analysis['summary']}")
                
                # Key flags
                if state["flags"]:
                    flags_text = ", ".join(state["flags"])
                    summary_parts.append(f"Key Concerns: {flags_text}")
                
                # Risk score
                summary_parts.append(f"Risk Score: {state['risk_score']}/10")
            
            state["summary"] = " | ".join(summary_parts) if summary_parts else "No significant risks identified"
            
            logger.info(f"Analysis complete. Risk Score: {state['risk_score']}")
            
        except Exception as e:
            state["error"] = f"Summary generation error: {str(e)}"
            logger.error(f"Summary generation failed: {e}")
        
        return state
    
    def _handle_error_node(self, state: AgentState) -> AgentState:
        """Node to handle errors and provide fallback response"""
        logger.error(f"Handling error in step '{state.get('step', 'unknown')}': {state.get('error', 'Unknown error')}")
        
        # Provide fallback values
        state["summary"] = f"Analysis failed: {state.get('error', 'Unknown error')}"
        state["risk_score"] = 0.0
        state["flags"] = ["Analysis Error"]
        state["analysis_result"] = {
            "error": True,
            "message": state.get("error", "Unknown error")
        }
        
        return state
    
    def _should_continue_after_scraping(self, state: AgentState) -> str:
        """Conditional logic after scraping"""
        if state.get("error") or not state.get("scraped_content"):
            return "error"
        return "continue"
    
    def _should_continue_after_analysis(self, state: AgentState) -> str:
        """Conditional logic after analysis"""
        if state.get("error") or not state.get("analysis_result"):
            return "error"
        return "continue"
    
    def _create_analysis_prompt(self, content: str) -> str:
        """Create detailed analysis prompt for OpenAI"""
        return f"""
        Analyze the following supplier website content for potential risks, compliance issues, and sustainability concerns.
        
        Please evaluate:
        1. Financial stability indicators
        2. Compliance and certification status
        3. ESG (Environmental, Social, Governance) factors
        4. Recent news or controversies
        5. Operational risks
        6. Regulatory compliance
        
        Content to analyze:
        {content[:8000]}  # Limit content to avoid token limits
        
        Provide your response in the following JSON format:
        {{
            "summary": "Brief summary of key findings",
            "riskScore": 0.0-10.0,
            "flags": ["list", "of", "specific", "risk", "factors"],
            "categories": {{
                "financial": 0.0-10.0,
                "compliance": 0.0-10.0,
                "esg": 0.0-10.0,
                "operational": 0.0-10.0
            }},
            "recommendations": ["list", "of", "recommended", "actions"]
        }}
        """
    
    def _parse_analysis_result(self, response: str) -> Dict[str, Any]:
        """Parse OpenAI response into structured format"""
        try:
            # Try to extract JSON from response
            if "```json" in response:
                json_start = response.find("```json") + 7
                json_end = response.find("```", json_start)
                json_str = response[json_start:json_end].strip()
            else:
                # Assume entire response is JSON
                json_str = response.strip()
            
            parsed = json.loads(json_str)
            return parsed
            
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"Failed to parse JSON response: {e}")
            # Fallback parsing
            return {
                "summary": "Analysis completed but response format was unexpected",
                "riskScore": 5.0,
                "flags": ["Response Parsing Issue"],
                "categories": {
                    "financial": 5.0,
                    "compliance": 5.0,
                    "esg": 5.0,
                    "operational": 5.0
                }
            }
    
    def _classify_risk_level(self, score: float) -> str:
        """Classify risk level based on score"""
        if score >= 8.0:
            return "HIGH RISK"
        elif score >= 6.0:
            return "MEDIUM-HIGH RISK"
        elif score >= 4.0:
            return "MEDIUM RISK"
        elif score >= 2.0:
            return "LOW-MEDIUM RISK"
        else:
            return "LOW RISK"
    
    def run_analysis(self, url: str) -> Dict[str, Any]:
        """
        Main method to run the complete supplier risk analysis
        
        Args:
            url: Supplier website URL to analyze
            
        Returns:
            Dict containing analysis results
        """
        logger.info(f"Starting supplier risk analysis for: {url}")
        
        # Initialize state
        initial_state = AgentState(
            url=url,
            scraped_content="",
            analysis_result={},
            risk_score=0.0,
            summary="",
            flags=[],
            error="",
            step="initialized"
        )
        
        try:
            # Run the workflow
            final_state = self.app.invoke(initial_state)
            
            # Structure the response
            result = {
                "success": not bool(final_state.get("error")),
                "url": url,
                "summary": final_state.get("summary", ""),
                "score": final_state.get("risk_score", 0.0),
                "riskScore": final_state.get("risk_score", 0.0),  # Alias for compatibility
                "flags": final_state.get("flags", []),
                "analysis": final_state.get("analysis_result", {}),
                "timestamp": datetime.now().isoformat(),
                "error": final_state.get("error", None)
            }
            
            logger.info(f"Analysis completed successfully. Risk Score: {result['score']}")
            return result
            
        except Exception as e:
            logger.error(f"Workflow execution failed: {e}")
            return {
                "success": False,
                "url": url,
                "summary": f"Analysis failed: {str(e)}",
                "score": 0.0,
                "riskScore": 0.0,
                "flags": ["System Error"],
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

# Convenience function for backend integration
def run_supplier_agent(url: str) -> Dict[str, Any]:
    """
    Convenience function to run supplier risk analysis
    This is the function called from your backend routes
    """
    agent = SupplierRiskAgent()
    return agent.run_analysis(url)

# Example usage and testing
if __name__ == "__main__":
    # Test the agent
    test_url = "https://example-supplier.com"
    
    agent = SupplierRiskAgent()
    result = agent.run_analysis(test_url)
    
    print("Analysis Result:")
    print(json.dumps(result, indent=2))