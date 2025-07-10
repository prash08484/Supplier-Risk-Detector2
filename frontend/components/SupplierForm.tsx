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
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Supplier Risk Analysis</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Enter a supplier's website URL to analyze their risk profile and get comprehensive insights
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* URL Input Section */}
          <div className="space-y-3">
            <label htmlFor="url" className="block text-base font-semibold text-gray-800 mb-2">
              Supplier Website URL
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-6 h-6 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className={`w-full pl-12 pr-12 py-4 text-lg border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                  !urlIsValid 
                    ? 'border-red-300 focus:border-red-500 bg-red-50' 
                    : 'border-gray-200 focus:border-blue-500 bg-white hover:border-gray-300'
                } ${loading ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
              />
              {url && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  {urlIsValid ? (
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                </div>
              )}
            </div>
            {!urlIsValid && url && (
              <div className="flex items-center space-x-2 mt-2">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-600 font-medium">Please enter a valid URL</p>
              </div>
            )}
            <p className="text-sm text-gray-500 flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Enter the main website URL of the supplier you want to analyze</span>
            </p>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Analysis Settings</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="maxDepth" className="block text-sm font-semibold text-gray-700">
                  Crawl Depth
                </label>
                <div className="relative">
                  <select
                    id="maxDepth"
                    value={maxDepth}
                    onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                    className="w-full appearance-none px-4 py-3 pr-10 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 disabled:opacity-50 disabled:bg-gray-50 cursor-pointer"
                    disabled={loading}
                  >
                    <option value={1}>Shallow (1 level)</option>
                    <option value={2}>Medium (2 levels)</option>
                    <option value={3}>Deep (3 levels)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500">How deep to crawl the website</p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="limit" className="block text-sm font-semibold text-gray-700">
                  Page Limit
                </label>
                <div className="relative">
                  <select
                    id="limit"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value))}
                    className="w-full appearance-none px-4 py-3 pr-10 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 disabled:opacity-50 disabled:bg-gray-50 cursor-pointer"
                    disabled={loading}
                  >
                    <option value={1}>Quick (1 page)</option>
                    <option value={3}>Standard (3 pages)</option>
                    <option value={5}>Detailed (5 pages)</option>
                    <option value={10}>Comprehensive (10 pages)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Maximum pages to analyze</p>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          {loading && (
            <div className="space-y-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold text-gray-800">Analyzing supplier...</span>
                <span className="text-base font-bold text-blue-600">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600 text-center font-medium">
                {progress < 30 && "🔍 Fetching supplier information..."}
                {progress >= 30 && progress < 60 && "⚡ Analyzing risk factors..."}
                {progress >= 60 && progress < 90 && "💡 Generating recommendations..."}
                {progress >= 90 && "✨ Finalizing analysis..."}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-red-800 mb-1">Analysis Error</h4>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !url.trim() || !urlIsValid}
            className={`w-full py-5 px-8 text-lg font-semibold rounded-xl transition-all duration-300 transform ${
              loading || !url.trim() || !urlIsValid
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-3">
                <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Analyzing Supplier...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center space-x-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Start Risk Analysis</span>
              </span>
            )}
          </button>
        </form>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-blue-900 mb-3">💡 Tips for Better Analysis</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Use the main company website URL (not subdomain pages)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Ensure the website is publicly accessible and not behind login</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Higher crawl depth and page limits provide more comprehensive analysis</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Analysis typically takes 30-60 seconds depending on website size</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

