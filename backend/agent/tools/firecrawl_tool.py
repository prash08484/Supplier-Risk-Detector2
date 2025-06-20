# backend/agent/tools/firecrawl_tool.py
import requests
import json
import logging
import time
from typing import Dict, Any, Optional
import os
from urllib.parse import urljoin, urlparse

logger = logging.getLogger(__name__)

class FirecrawlTool:
    """
    Tool for scraping websites using Firecrawl API
    Handles website content extraction including documents, ESG reports, and news
    """
    
    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://api.firecrawl.dev"):
        self.api_key = api_key or os.getenv("FIRECRAWL_API_KEY")
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        if not self.api_key:
            logger.warning("Firecrawl API key not provided. Set FIRECRAWL_API_KEY environment variable.")
    
    def scrape_website(self, url: str, include_links: bool = True, max_depth: int = 2) -> Dict[str, Any]:
        """
        Scrape a supplier website for comprehensive content analysis
        
        Args:
            url: Website URL to scrape
            include_links: Whether to crawl related pages
            max_depth: Maximum crawl depth for linked pages
            
        Returns:
            Dict containing scraped content and metadata
        """
        try:
            logger.info(f"Starting Firecrawl scraping for: {url}")
            
            # Prepare scraping configuration
            scrape_config = {
                "url": url,
                "formats": ["markdown", "html"],
                "includeTags": ["title", "meta", "h1", "h2", "h3", "p", "div", "article", "section"],
                "excludeTags": ["script", "style", "nav", "footer", "ads"],
                "waitFor": 3000,  # Wait 3 seconds for dynamic content
                "timeout": 30000,  # 30 second timeout
            }
            
            # If crawling multiple pages
            if include_links and max_depth > 0:
                return self._crawl_multiple_pages(url, max_depth)
            else:
                return self._scrape_single_page(scrape_config)
                
        except Exception as e:
            logger.error(f"Firecrawl scraping failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "content": "",
                "metadata": {}
            }
    
    def _scrape_single_page(self, scrape_config: Dict[str, Any]) -> Dict[str, Any]:
        """Scrape a single page using Firecrawl"""
        try:
            response = requests.post(
                f"{self.base_url}/v0/scrape",
                headers=self.headers,
                json=scrape_config,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get("success"):
                    content = self._extract_content(result)
                    return {
                        "success": True,
                        "content": content,
                        "metadata": result.get("metadata", {}),
                        "url": scrape_config["url"]
                    }
                else:
                    return {
                        "success": False,
                        "error": result.get("error", "Unknown scraping error"),
                        "content": "",
                        "metadata": {}
                    }
            else:
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}: {response.text}",
                    "content": "",
                    "metadata": {}
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            return {
                "success": False,
                "error": f"Request failed: {str(e)}",
                "content": "",
                "metadata": {}
            }
    
    def _crawl_multiple_pages(self, url: str, max_depth: int) -> Dict[str, Any]:
        """Crawl multiple pages from a website"""
        try:
            crawl_config = {
                "url": url,
                "crawlerOptions": {
                    "maxDepth": max_depth,
                    "limit": 10,  # Limit to 10 pages to avoid excessive scraping
                    "allowBackwardCrawling": False,
                    "allowExternalContent": False
                },
                "pageOptions": {
                    "formats": ["markdown"],
                    "includeTags": ["title", "meta", "h1", "h2", "h3", "p", "div", "article", "section"],
                    "excludeTags": ["script", "style", "nav", "footer", "ads"],
                    "waitFor": 2000
                }
            }
            
            # Start crawl job
            response = requests.post(
                f"{self.base_url}/v0/crawl",
                headers=self.headers,
                json=crawl_config,
                timeout=60
            )
            
            if response.status_code != 200:
                return self._fallback_to_single_page(url)
            
            crawl_result = response.json()
            job_id = crawl_result.get("jobId")
            
            if not job_id:
                return self._fallback_to_single_page(url)
            
            # Poll for results
            return self._poll_crawl_results(job_id, url)
            
        except Exception as e:
            logger.error(f"Crawling failed: {e}")
            return self._fallback_to_single_page(url)
    
    def _poll_crawl_results(self, job_id: str, original_url: str) -> Dict[str, Any]:
        """Poll Firecrawl crawl job for results"""
        max_attempts = 30  # 5 minutes max
        attempt = 0
        
        while attempt < max_attempts:
            try:
                response = requests.get(
                    f"{self.base_url}/v0/crawl/status/{job_id}",
                    headers=self.headers,
                    timeout=30
                )
                
                if response.status_code != 200:
                    break
                
                result = response.json()
                status = result.get("status")
                
                if status == "completed":
                    # Process crawl results
                    pages = result.get("data", [])
                    combined_content = self._combine_crawled_content(pages)
                    
                    return {
                        "success": True,
                        "content": combined_content,
                        "metadata": {
                            "pages_crawled": len(pages),
                            "crawl_depth": result.get("crawlDepth", 1)
                        },
                        "url": original_url
                    }
                
                elif status == "failed":
                    break
                
                # Still in progress, wait and retry
                time.sleep(10)
                attempt += 1
                
            except Exception as e:
                logger.error(f"Error polling crawl status: {e}")
                break
        
        # Fallback to single page if crawling fails
        return self._fallback_to_single_page(original_url)
    
    def _fallback_to_single_page(self, url: str) -> Dict[str, Any]:
        """Fallback to single page scraping if crawling fails"""
        logger.info(f"Falling back to single page scraping for: {url}")
        
        scrape_config = {
            "url": url,
            "formats": ["markdown"],
            "includeTags": ["title", "meta", "h1", "h2", "h3", "p", "div", "article", "section"],
            "excludeTags": ["script", "style", "nav", "footer", "ads"],
            "waitFor": 3000,
            "timeout": 30000
        }
        
        return self._scrape_single_page(scrape_config)
    
    def _extract_content(self, result: Dict[str, Any]) -> str:
        """Extract and clean content from Firecrawl result"""
        content_parts = []
        
        # Get markdown content (preferred)
        markdown_content = result.get("markdown", "")
        if markdown_content:
            content_parts.append(markdown_content)
        
        # Get HTML content as fallback
        html_content = result.get("html", "")
        if html_content and not markdown_content:
            content_parts.append(self._clean_html_content(html_content))
        
        # Get metadata
        metadata = result.get("metadata", {})
        if metadata:
            title = metadata.get("title", "")
            description = metadata.get("description", "")
            
            if title:
                content_parts.insert(0, f"Title: {title}")
            if description:
                content_parts.insert(1 if title else 0, f"Description: {description}")
        
        return "\n\n".join(content_parts)
    
    def _combine_crawled_content(self, pages: list) -> str:
        """Combine content from multiple crawled pages"""
        combined_parts = []
        
        for i, page in enumerate(pages):
            if not page.get("markdown") and not page.get("html"):
                continue
                
            page_content = []
            
            # Add page URL as header
            page_url = page.get("url", f"Page {i+1}")
            page_content.append(f"=== {page_url} ===")
            
            # Add page content
            content = page.get("markdown") or self._clean_html_content(page.get("html", ""))
            if content:
                page_content.append(content)
            
            if page_content:
                combined_parts.append("\n".join(page_content))
        
        return "\n\n" + "="*50 + "\n\n".join(combined_parts)
    
    def _clean_html_content(self, html_content: str) -> str:
        """Basic HTML content cleaning"""
        # This is a simplified version - you might want to use BeautifulSoup for better cleaning
        import re
        
        # Remove HTML tags
        clean_text = re.sub(r'<[^>]+>', ' ', html_content)
        
        # Clean up whitespace
        clean_text = re.sub(r'\s+', ' ', clean_text)
        
        # Remove empty lines
        clean_text = '\n'.join(line.strip() for line in clean_text.split('\n') if line.strip())
        
        return clean_text.strip()
    
    def get_page_metadata(self, url: str) -> Dict[str, Any]:
        """Get basic metadata about a page without full scraping"""
        try:
            response = requests.post(
                f"{self.base_url}/v0/scrape",
                headers=self.headers,
                json={
                    "url": url,
                    "formats": ["extract"],
                    "onlyMainContent": False,
                    "timeout": 15000
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("metadata", {})
            
        except Exception as e:
            logger.error(f"Failed to get page metadata: {e}")
        
        return {}

# Example usage
if __name__ == "__main__":
    # Test the Firecrawl tool
    tool = FirecrawlTool()
    result = tool.scrape_website("https://example.com")
    
    if result["success"]:
        print(f"Scraped content length: {len(result['content'])}")
        print(f"Content preview: {result['content'][:200]}...")
    else:
        print(f"Scraping failed: {result['error']}")