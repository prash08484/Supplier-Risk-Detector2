'use client';

import { useState } from 'react';
import { analyzeSupplier } from '../lib/api';
import { normalizeUrl } from '../lib/normalizeUrl';

interface SupplierFormProps {
  onAnalysisComplete: (data: any) => void;
}

export default function SupplierForm({ onAnalysisComplete }: SupplierFormProps) {
  const [url, setUrl] = useState('');
  const [maxDepth, setMaxDepth] = useState<number>(2);
  const [limit, setLimit] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 20;
        });
      }, 500);

      const normalized = normalizeUrl(url);
      if (!normalized) {
        throw new Error('Please enter a valid URL (e.g., https://example.com)');
      }

      const result = await analyzeSupplier(normalized, {
        include_links: true,
        max_depth: maxDepth,
        limit: limit,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success && result.data) {
        const normalizedData = {
          supplier_name: result.data.company_name,
          risk_score: result.data.analysis.sustainability_score * 10,
          risk_level: result.data.analysis.risk_level,
          factors: result.data.analysis.key_findings,
          recommendations: result.data.analysis.recommendations,
        };

        setTimeout(() => {
          onAnalysisComplete(normalizedData);
          setUrl('');
          setProgress(0);
        }, 500);
      } else {
        setError(result?.error || 'Analysis failed. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please check your URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const urlIsValid = url.trim() === '' || isValidUrl(url);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Supplier Risk Analysis</h3>
        <p className="text-gray-600">Enter a supplier's website URL to analyze their risk profile</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL Input */}
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            Supplier Website URL
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
              </svg>
            </div>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              disabled={loading}
              className={`input-field pl-10 ${!urlIsValid ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {url && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {urlIsValid ? (
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            )}
          </div>
          {!urlIsValid && url && (
            <p className="mt-1 text-sm text-red-600">Please enter a valid URL</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Enter the main website URL of the supplier you want to analyze
          </p>
        </div>

        {/* Depth and Limit Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="maxDepth" className="block text-sm font-medium text-gray-700 mb-1">
              Crawl Depth
            </label>
            <input
              type="number"
              id="maxDepth"
              value={maxDepth}
              onChange={(e) => setMaxDepth(parseInt(e.target.value))}
              min={1}
              max={3}
              className="input-field"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">
              Page Limit
            </label>
            <input
              type="number"
              id="limit"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              min={1}
              max={10}
              className="input-field"
              disabled={loading}
            />
          </div>
        </div>

        {/* Progress Bar */}
        {loading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Analyzing supplier...</span>
              <span className="text-gray-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 text-center">
              {progress < 30 && "Fetching supplier information..."}
              {progress >= 30 && progress < 60 && "Analyzing risk factors..."}
              {progress >= 60 && progress < 90 && "Generating recommendations..."}
              {progress >= 90 && "Finalizing analysis..."}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !url.trim() || !urlIsValid}
          className={`w-full btn-primary text-lg py-4 ${loading || !url.trim() || !urlIsValid ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
        >
          {loading ? (
            <span className="flex items-center justify-center space-x-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Analyzing Supplier...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Analyze Supplier Risk</span>
            </span>
          )}
        </button>
      </form>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for better analysis:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use the main company website URL (not subdomain pages)</li>
          <li>• Ensure the website is publicly accessible</li>
          <li>• Adjust crawl depth and page limit for deeper scans</li>
        </ul>
      </div>
    </div>
  );
}
