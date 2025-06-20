# Fixed firecrawl_tool.py - Improved error handling and debugging
import requests
import json
import logging
import time
from typing import Dict, Any, Optional
import os
from urllib.parse import urljoin, urlparse
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class FirecrawlTool:
    """
    Tool for scraping websites using Firecrawl API
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
        """
        try:
            logger.info(f"Starting Firecrawl scraping for: {url}")
            
            # Ensure URL has protocol
            if not url.startswith(('http://', 'https://')):
                url = f"https://{url}"
            
            # For debugging - start with single page first
            if include_links and max_depth > 0:
                logger.info("Attempting multi-page crawl...")
                result = self._crawl_multiple_pages(url, max_depth)
                
                # If crawling fails, fallback to single page
                if not result["success"]:
                    logger.info("Multi-page crawl failed, falling back to single page")
                    return self._scrape_single_page_simple(url)
                return result
            else:
                logger.info("Performing single page scrape...")
                return self._scrape_single_page_simple(url)
                
        except Exception as e:
            logger.error(f"Firecrawl scraping failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "content": "",
                "metadata": {}
            }
    
    def _scrape_single_page_simple(self, url: str) -> Dict[str, Any]:
        """Simple single page scraping with better error handling"""
        try:
            logger.info(f"Making Firecrawl API call to: {self.base_url}/v0/scrape")
            
            scrape_config = {
                "url": url,
                "formats": ["markdown"],
                "waitFor": 2000,
                "timeout": 15000
            }
            
            response = requests.post(
                f"{self.base_url}/v0/scrape",
                headers=self.headers,
                json=scrape_config,
                timeout=30
            )
            
            logger.info(f"Firecrawl API response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Firecrawl API response success: {result.get('success', False)}")
                
                if result.get("success"):
                    content = self._extract_content(result)
                    logger.info(f"Extracted content length: {len(content)}")
                    
                    return {
                        "success": True,
                        "content": content,
                        "metadata": result.get("metadata", {}),
                        "url": url
                    }
                else:
                    error_msg = result.get("error", "Unknown scraping error")
                    logger.error(f"Firecrawl API error: {error_msg}")
                    return {
                        "success": False,
                        "error": error_msg,
                        "content": "",
                        "metadata": {}
                    }
            else:
                error_msg = f"HTTP {response.status_code}: {response.text[:200]}"
                logger.error(f"Firecrawl API HTTP error: {error_msg}")
                return {
                    "success": False,
                    "error": error_msg,
                    "content": "",
                    "metadata": {}
                }
                
        except requests.exceptions.Timeout:
            logger.error("Firecrawl API timeout")
            return {
                "success": False,
                "error": "API request timeout",
                "content": "",
                "metadata": {}
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Firecrawl API request failed: {e}")
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
                    "maxDepth": min(max_depth, 2),  # Limit depth to avoid timeouts
                    "limit": 5,  # Reduced limit
                    "allowBackwardCrawling": False,
                    "allowExternalContent": False
                },
                "pageOptions": {
                    "formats": ["markdown"],
                    "waitFor": 2000,
                    "timeout": 10000
                }
            }
            
            logger.info("Starting crawl job...")
            response = requests.post(
                f"{self.base_url}/v0/crawl",
                headers=self.headers,
                json=crawl_config,
                timeout=60
            )
            
            if response.status_code != 200:
                logger.error(f"Crawl start failed: {response.status_code}")
                return self._scrape_single_page_simple(url)
            
            crawl_result = response.json()
            job_id = crawl_result.get("jobId")
            
            if not job_id:
                logger.error("No job ID received from crawl")
                return self._scrape_single_page_simple(url)
            
            logger.info(f"Crawl job started with ID: {job_id}")
            return self._poll_crawl_results(job_id, url)
            
        except Exception as e:
            logger.error(f"Crawling failed: {e}")
            return self._scrape_single_page_simple(url)
    
    def _poll_crawl_results(self, job_id: str, original_url: str) -> Dict[str, Any]:
        """Poll Firecrawl crawl job for results"""
        max_attempts = 15  # Reduced from 30
        attempt = 0
        
        while attempt < max_attempts:
            try:
                response = requests.get(
                    f"{self.base_url}/v0/crawl/status/{job_id}",
                    headers=self.headers,
                    timeout=30
                )
                
                if response.status_code != 200:
                    logger.error(f"Status check failed: {response.status_code}")
                    break
                
                result = response.json()
                status = result.get("status")
                logger.info(f"Crawl status: {status} (attempt {attempt + 1})")
                
                if status == "completed":
                    pages = result.get("data", [])
                    if pages:
                        combined_content = self._combine_crawled_content(pages)
                        logger.info(f"Crawl completed with {len(pages)} pages")
                        
                        return {
                            "success": True,
                            "content": combined_content,
                            "metadata": {
                                "pages_crawled": len(pages),
                                "crawl_depth": result.get("crawlDepth", 1)
                            },
                            "url": original_url
                        }
                    else:
                        logger.warning("Crawl completed but no pages found")
                        break
                
                elif status == "failed":
                    logger.error("Crawl job failed")
                    break
                
                # Still in progress, wait and retry
                time.sleep(8)  # Reduced from 10
                attempt += 1
                
            except Exception as e:
                logger.error(f"Error polling crawl status: {e}")
                break
        
        logger.info("Crawl polling timeout, falling back to single page")
        return self._scrape_single_page_simple(original_url)
    
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
        
        final_content = "\n\n".join(content_parts)
        logger.info(f"Content extraction completed: {len(final_content)} characters")
        return final_content
    
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
        import re
        
        # Remove HTML tags
        clean_text = re.sub(r'<[^>]+>', ' ', html_content)
        
        # Clean up whitespace
        clean_text = re.sub(r'\s+', ' ', clean_text)
        
        # Remove empty lines
        clean_text = '\n'.join(line.strip() for line in clean_text.split('\n') if line.strip())
        
        return clean_text.strip()