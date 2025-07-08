'use client';

import { useState } from 'react';
import AIChat from './AIChat';

interface SupplierReportProps {
  data?: {
    supplier_name?: string;
    normalized_url?: string; // ✅ Add support for backend-passed normalized URL
    risk_score?: number;
    risk_level?: string;
    factors?: string[];
    recommendations?: string[];
  };
}

export default function SupplierReport({ data }: SupplierReportProps) {
  const [showChat, setShowChat] = useState(false);

  if (!data) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Analysis Results
        </h2>
        <p className="text-gray-500">No analysis data available. Submit a URL to get started.</p>
      </div>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
      case 'medium-high':
      case 'low-medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm relative">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Analysis Results
      </h2>

      <div className="space-y-6">
        {/* Supplier Info */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-2">Supplier Information</h3>
          <p className="text-gray-700">{data.supplier_name || 'Unknown Supplier'}</p>
        </div>

        {/* Risk Score */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-2">Risk Assessment</h3>
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-gray-900">
              {data.risk_score ?? 0}/100
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getRiskColor(data.risk_level || '')}`}>
              {data.risk_level || 'Unknown'} Risk
            </span>
          </div>
        </div>

        {/* Risk Factors */}
        {data.factors && data.factors.length > 0 && (
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-2">Risk Factors</h3>
            <ul className="space-y-2">
              {data.factors.map((factor, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span className="text-gray-700">{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-2">Recommendations</h3>
            <ul className="space-y-2">
              {data.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Assistant Button */}
        <div className="pt-4">
          <button
            onClick={() => setShowChat(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            Ask AI Assistant
          </button>
        </div>
      </div>

      {/* AI Chat Modal */}
      {showChat && (
        <AIChat
          url={data.normalized_url || ''} // ✅ Prefer normalized_url from backend
          name={data.supplier_name || ''}
          riskScore={(data.risk_score ?? 0).toFixed(1)}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}
