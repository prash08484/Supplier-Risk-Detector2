# backend/agent/tools/openai_tool.py
import openai
import json
import logging
import os
from typing import Dict, Any, Optional, List
import re
from datetime import datetime

logger = logging.getLogger(__name__)

class OpenAITool:
    """
    Tool for analyzing supplier content using OpenAI GPT models
    Specializes in risk assessment, compliance analysis, and ESG evaluation
    """
    
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4-turbo-preview"):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.model = model
        
        if not self.api_key:
            logger.warning("OpenAI API key not provided. Set OPENAI_API_KEY environment variable.")
            return
            
        # Initialize OpenAI client
        openai.api_key = self.api_key
        self.client = openai.OpenAI(api_key=self.api_key)
    
    def analyze_supplier_risks(self, content: str, prompt: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze supplier content for various risk factors
        
        Args:
            content: Scraped website content to analyze
            prompt: Custom analysis prompt (optional)
            
        Returns:
            Dict containing analysis results
        """
        try:
            logger.info(f"Starting OpenAI risk analysis on {len(content)} characters of content")
            
            # Use provided prompt or default comprehensive prompt
            analysis_prompt = prompt or self._create_comprehensive_risk_prompt()
            
            # Prepare messages for chat completion
            messages = [
                {
                    "role": "system",
                    "content": self._get_system_prompt()
                },
                {
                    "role": "user",
                    "content": f"{analysis_prompt}\n\nContent to analyze:\n{content[:12000]}"  # Limit to avoid token limits
                }
            ]
            
            # Make API call
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.1,  # Low temperature for consistent analysis
                max_tokens=2000,
                timeout=60
            )
            
            if response.choices and response.choices[0].message:
                analysis_text = response.choices[0].message.content
                
                return {
                    "success": True,
                    "response": analysis_text,
                    "model_used": self.model,
                    "tokens_used": response.usage.total_tokens if response.usage else 0,
                    "timestamp": datetime.now().isoformat()
                }
            else:
                return {
                    "success": False,
                    "error": "No response from OpenAI",
                    "response": ""
                }
                
        except Exception as e:
            logger.error(f"OpenAI analysis failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "response": ""
            }
    
    def _get_system_prompt(self) -> str:
        """Get the system prompt for the AI assistant"""
        return """You are an expert supplier risk analyst with deep knowledge in:
        - Financial risk assessment
        - Regulatory compliance evaluation
        - ESG (Environmental, Social, Governance) analysis
        - Supply chain risk management
        - Corporate transparency and reporting
        - Industry-specific risk factors
        
        Your task is to analyze supplier website content and provide comprehensive risk assessments.
        Always provide responses in valid JSON format with specific risk scores and actionable insights.
        Focus on factual analysis based on the provided content, avoiding speculation."""
    
    def _create_comprehensive_risk_prompt(self) -> str:
        """Create a comprehensive risk analysis prompt"""
        return """
        Please analyze the following supplier website content for potential risks across multiple dimensions.
        
        Evaluate the following risk categories:
        
        1. **Financial Risks** (0-10 scale):
           - Financial stability indicators
           - Revenue trends and profitability
           - Debt levels and liquidity
           - Financial reporting transparency
        
        2. **Compliance Risks** (0-10 scale):
           - Industry certifications (ISO, SOC, etc.)  
           - Regulatory compliance status
           - Legal issues or violations
           - Quality management systems
        
        3. **ESG Risks** (0-10 scale):
           - Environmental impact and sustainability
           - Social responsibility practices
           - Governance structure and ethics
           - Diversity and inclusion policies
        
        4. **Operational Risks** (0-10 scale):
           - Business continuity planning
           - Cybersecurity posture
           - Supply chain dependencies
           - Geographic concentration risks
        
        5. **Reputational Risks** (0-10 scale):
           - Recent news or controversies
           - Customer complaints or issues
           - Market perception and brand strength
           - Social media sentiment
        
        Provide your analysis in the following JSON format:
        {
            "summary": "2-3 sentence summary of key risk findings",
            "overallRiskScore": 0.0,
            "riskScore": 0.0,
            "riskLevel": "LOW|MEDIUM|HIGH",
            "confidence": "LOW|MEDIUM|HIGH",
            "flags": ["specific risk factors identified"],
            "categories": {
                "financial": 0.0,
                "compliance": 0.0,
                "esg": 0.0,
                "operational": 0.0,
                "reputational": 0.0
            },
            "strengths": ["positive aspects identified"],
            "concerns": ["areas of concern or missing information"],
            "recommendations": ["specific actions to mitigate identified risks"],
            "dataQuality": "Assessment of information availability and completeness",
            "lastUpdated": "When was the analyzed content last updated (if determinable)"
        }
        
        Scoring Guidelines:
        - 0-2: Very Low Risk
        - 3-4: Low Risk  
        - 5-6: Medium Risk
        - 7-8: High Risk
        - 9-10: Very High Risk
        
        Base your analysis strictly on the provided content. If information is missing or unclear, note this in your assessment and adjust confidence accordingly.
        """
    
    def analyze_financial_stability(self, content: str) -> Dict[str, Any]:
        """Focused analysis of financial stability indicators"""
        prompt = """
        Analyze the provided content specifically for financial stability indicators.
        
        Look for:
        - Financial statements or performance data
        - Revenue growth or decline indicators
        - Profitability metrics
        - Debt and liquidity information
        - Financial reporting frequency and quality
        - Auditor information
        - Investment or funding news
        
        Provide response in JSON format:
        {
            "financialScore": 0.0,
            "indicators": {
                "revenue_stability": "POSITIVE|NEUTRAL|NEGATIVE|UNKNOWN",
                "profitability": "POSITIVE|NEUTRAL|NEGATIVE|UNKNOWN",
                "debt_levels": "LOW|MODERATE|HIGH|UNKNOWN",
                "liquidity": "STRONG|ADEQUATE|WEAK|UNKNOWN"
            },
            "evidence": ["specific pieces of evidence found"],
            "missing_info": ["key financial information not found"],
            "red_flags": ["concerning financial indicators"]
        }
        """
        
        return self.analyze_supplier_risks(content, prompt)
    
    def analyze_compliance_status(self, content: str) -> Dict[str, Any]:
        """Focused analysis of compliance and certifications"""
        prompt = """
        Analyze the provided content for compliance and certification status.
        
        Look for:
        - Industry certifications (ISO 9001, ISO 14001, SOC 2, etc.)
        - Regulatory compliance mentions
        - Quality management systems
        - Security certifications
        - Legal compliance statements
        - Recent violations or issues
        - Audit results
        
        Provide response in JSON format:
        {
            "complianceScore": 0.0,
            "certifications": ["list of certifications found"],
            "compliance_areas": {
                "quality": "CERTIFIED|COMPLIANT|UNKNOWN|NON_COMPLIANT",
                "security": "CERTIFIED|COMPLIANT|UNKNOWN|NON_COMPLIANT",
                "environmental": "CERTIFIED|COMPLIANT|UNKNOWN|NON_COMPLIANT",
                "industry_specific": "CERTIFIED|COMPLIANT|UNKNOWN|NON_COMPLIANT"
            },
            "expiry_dates": ["certification expiry information if available"],
            "gaps": ["compliance gaps or missing certifications"],
            "violations": ["any compliance violations found"]
        }
        """
        
        return self.analyze_supplier_risks(content, prompt)
    
    def analyze_esg_factors(self, content: str) -> Dict[str, Any]:
        """Focused ESG (Environmental, Social, Governance) analysis"""
        prompt = """
        Analyze the provided content for ESG (Environmental, Social, Governance) factors.
        
        Environmental factors:
        - Sustainability initiatives
        - Environmental certifications
        - Carbon footprint reduction
        - Waste management
        - Resource efficiency
        
        Social factors:
        - Employee welfare and safety
        - Diversity and inclusion
        - Community engagement
        - Labor practices
        - Human rights policies
        
        Governance factors:
        - Corporate structure
        - Board composition
        - Ethics and transparency
        - Anti-corruption policies
        - Stakeholder engagement
        
        Provide response in JSON format:
        {
            "esgScore": 0.0,
            "environmental": {
                "score": 0.0,
                "initiatives": ["environmental programs found"],
                "certifications": ["environmental certifications"]
            },
            "social": {
                "score": 0.0,
                "programs": ["social responsibility programs"],
                "diversity": "STRONG|MODERATE|WEAK|UNKNOWN"
            },
            "governance": {
                "score": 0.0,
                "transparency": "HIGH|MEDIUM|LOW",
                "ethics_policies": ["ethics and compliance policies found"]
            },
            "sustainability_reporting": "COMPREHENSIVE|BASIC|MINIMAL|NONE",
            "esg_risks": ["specific ESG risks identified"]
        }
        """
        
        return self.analyze_supplier_risks(content, prompt)
    
    def detect_red_flags(self, content: str) -> Dict[str, Any]:
        """Detect specific red flags and warning signs"""
        prompt = """
        Analyze the content specifically for red flags and warning signs that indicate high risk.
        
        Look for:
        - Recent negative news or controversies
        - Legal issues or lawsuits
        - Financial distress indicators
        - Regulatory violations
        - Customer complaints or quality issues
        - Management changes or instability
        - Cybersecurity incidents
        - Supply chain disruptions
        - Bankruptcy or insolvency risks
        
        Provide response in JSON format:
        {
            "redFlagScore": 0.0,
            "criticalFlags": ["immediate high-risk concerns"],
            "warningFlags": ["moderate risk indicators"],
            "categories": {
                "legal": ["legal issues found"],
                "financial": ["financial warning signs"],
                "operational": ["operational concerns"],
                "reputational": ["reputation risks"],
                "compliance": ["compliance violations"]
            },
            "urgency": "IMMEDIATE|HIGH|MEDIUM|LOW",
            "recommendations": ["immediate actions recommended"]
        }
        """
        
        return self.analyze_supplier_risks(content, prompt)
    
    def generate_risk_summary(self, analyses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate consolidated risk summary from multiple analyses"""
        try:
            # Combine all analysis results
            combined_data = {
                "analyses": analyses,
                "timestamp": datetime.now().isoformat()
            }
            
            prompt = f"""
            Based on the following multiple risk analyses, provide a consolidated risk assessment summary.
            
            Analysis Data: {json.dumps(combined_data, indent=2)}
            
            Provide a comprehensive summary in JSON format:
            {{
                "executiveSummary": "High-level risk assessment summary",
                "overallRiskScore": 0.0,
                "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
                "topRisks": ["3-5 most significant risks identified"],
                "riskDistribution": {{
                    "financial": 0.0,
                    "compliance": 0.0,
                    "esg": 0.0,
                    "operational": 0.0,
                    "reputational": 0.0
                }},
                "actionPriorities": ["prioritized list of recommended actions"],
                "monitoringRecommendations": ["ongoing monitoring suggestions"],
                "decisionRecommendation": "APPROVE|APPROVE_WITH_CONDITIONS|REVIEW_REQUIRED|REJECT"
            }}
            """
            
            messages = [
                {
                    "role": "system", 
                    "content": "You are a senior risk analyst creating executive summaries from detailed risk assessments."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.1,
                max_tokens=1500,
                timeout=60
            )
            
            if response.choices and response.choices[0].message:
                return {
                    "success": True,
                    "response": response.choices[0].message.content,
                    "model_used": self.model
                }
            
        except Exception as e:
            logger.error(f"Risk summary generation failed: {e}")
        
        return {
            "success": False,
            "error": "Failed to generate risk summary",
            "response": ""
        }
    
    def validate_analysis_result(self, analysis_text: str) -> Dict[str, Any]:
        """Validate and clean analysis results"""
        try:
            # Try to extract JSON from the response
            json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                parsed_result = json.loads(json_str)
                
                # Validate required fields
                required_fields = ['summary', 'riskScore', 'flags']
                for field in required_fields:
                    if field not in parsed_result:
                        parsed_result[field] = self._get_default_value(field)
                
                # Ensure risk score is within valid range
                if 'riskScore' in parsed_result:
                    parsed_result['riskScore'] = max(0.0, min(10.0, float(parsed_result['riskScore'])))
                
                return {
                    "success": True,
                    "parsed_result": parsed_result,
                    "raw_response": analysis_text
                }
            
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"Failed to parse analysis JSON: {e}")
        
        # Fallback parsing
        return {
            "success": False,
            "parsed_result": self._create_fallback_result(analysis_text),
            "raw_response": analysis_text
        }
    
    def _get_default_value(self, field: str) -> Any:
        """Get default values for missing fields"""
        defaults = {
            'summary': 'Analysis completed with limited information',
            'riskScore': 5.0,
            'flags': ['Incomplete Analysis'],
            'categories': {
                'financial': 5.0,
                'compliance': 5.0,
                'esg': 5.0,
                'operational': 5.0
            }
        }
        return defaults.get(field, None)
    
    def _create_fallback_result(self, analysis_text: str) -> Dict[str, Any]:
        """Create fallback result when JSON parsing fails"""
        # Try to extract key information from text
        risk_keywords = ['risk', 'concern', 'issue', 'problem', 'violation', 'gap']
        found_risks = []
        
        for keyword in risk_keywords:
            if keyword.lower() in analysis_text.lower():
                found_risks.append(f"Potential {keyword} identified in analysis")
        
        return {
            "summary": "Analysis completed but response format was non-standard",
            "riskScore": 5.0,  # Default medium risk
            "flags": found_risks if found_risks else ["Analysis Format Issue"],
            "categories": {
                "financial": 5.0,
                "compliance": 5.0,
                "esg": 5.0,
                "operational": 5.0
            }
        }

# Example usage
if __name__ == "__main__":
    # Test the OpenAI tool
    tool = OpenAITool()
    
    sample_content = """
    ABC Manufacturing Corp is a leading supplier of automotive components.
    We maintain ISO 9001 certification and have been in business for 25 years.
    Our annual revenue is $50M with steady growth over the past 5 years.
    We are committed to sustainability and have implemented various environmental initiatives.
    """
    
    result = tool.analyze_supplier_risks(sample_content)
    
    if result["success"]:
        print("Analysis successful!")
        print(f"Response length: {len(result['response'])}")
        print(f"Tokens used: {result.get('tokens_used', 'N/A')}")
    else:
        print(f"Analysis failed: {result['error']}")