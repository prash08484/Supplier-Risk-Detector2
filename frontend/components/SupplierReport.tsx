'use client';

import { useState } from 'react';

interface SupplierReportProps {
  data?: {
    supplier_name?: string;
    normalized_url?: string;
    risk_score?: number;
    risk_level?: string;
    factors?: string[];
    recommendations?: string[];
  };
  onAIChatToggle?: (show: boolean) => void;
  compact?: boolean;
}

export default function SupplierReport({ data, onAIChatToggle, compact = false }: SupplierReportProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'factors' | 'recommendations'>('overview');

  if (!data) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis Results</h3>
          <p className="text-gray-600 text-sm">Submit a supplier URL to view detailed risk analysis</p>
        </div>

        {/* Empty State */}
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <div className="space-y-3">
            <div className="text-3xl">📊</div>
            <h4 className="text-base font-medium text-gray-900">No Analysis Data</h4>
            <p className="text-gray-600 text-sm max-w-sm mx-auto">
              Complete a supplier analysis to see detailed risk assessment, factors, and recommendations here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          badge: 'bg-red-100 text-red-800',
          icon: 'text-red-600'
        };
      case 'medium':
      case 'medium-high':
      case 'low-medium':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          badge: 'bg-yellow-100 text-yellow-800',
          icon: 'text-yellow-600'
        };
      case 'low':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          badge: 'bg-green-100 text-green-800',
          icon: 'text-green-600'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          badge: 'bg-gray-100 text-gray-800',
          icon: 'text-gray-600'
        };
    }
  };

  const riskColors = getRiskColor(data.risk_level || '');
  const riskScore = data.risk_score ?? 0;

  const getRiskIcon = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return (
          <svg className={`${compact ? 'w-6 h-6' : 'w-8 h-8'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'medium':
      case 'medium-high':
      case 'low-medium':
        return (
          <svg className={`${compact ? 'w-6 h-6' : 'w-8 h-8'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'low':
        return (
          <svg className={`${compact ? 'w-6 h-6' : 'w-8 h-8'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className={`${compact ? 'w-6 h-6' : 'w-8 h-8'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const tabItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'factors', label: 'Risk Factors', icon: '⚠️' },
    { id: 'recommendations', label: 'Recommendations', icon: '💡' }
  ];

  const headerSize = compact ? 'text-xl' : 'text-3xl';
  const subHeaderSize = compact ? 'text-base' : 'text-xl';
  const cardPadding = compact ? 'p-4' : 'p-8';
  const spacing = compact ? 'space-y-4' : 'space-y-8';

  return (
    <div className={spacing}>
      {/* Header Section - Compact */}
      <div className="text-center">
        <div className={`${compact ? 'w-16 h-16' : 'w-20 h-20'} ${riskColors.bg} ${riskColors.border} border-2 rounded-full flex items-center justify-center mx-auto mb-4`}>
          <div className={riskColors.icon}>
            {getRiskIcon(data.risk_level || '')}
          </div>
        </div>
        <h2 className={`${headerSize} font-bold text-gray-900 mb-2`}>Risk Analysis Complete</h2>
        <p className={`${subHeaderSize} text-gray-600 mb-4`}>Assessment for {data.supplier_name || 'Unknown Supplier'}</p>
      </div>

      {/* Risk Score Card - Optimized */}
      <div className={`${riskColors.bg} ${riskColors.border} border-2 rounded-xl ${compact ? 'p-4' : 'p-6'} mb-6`}>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className={`${compact ? 'text-4xl' : 'text-6xl'} font-bold text-gray-900`}>{riskScore}/100</div>
            <span className={`px-4 py-2 ${compact ? 'text-base' : 'text-lg'} font-semibold rounded-full ${riskColors.badge}`}>
              {data.risk_level || 'Unknown'} Risk
            </span>
          </div>
          
          {/* Risk Score Bar */}
          <div className={`w-full bg-gray-200 rounded-full ${compact ? 'h-3' : 'h-4'} mb-4`}>
            <div 
              className={`${compact ? 'h-3' : 'h-4'} rounded-full transition-all duration-1000 ease-out ${
                riskScore > 70 ? 'bg-red-500' :
                riskScore > 40 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${riskScore}%` }}
            ></div>
          </div>
          
          <p className={`${compact ? 'text-sm' : 'text-base'} font-medium ${riskColors.text}`}>
            {riskScore > 70 ? 'High risk requires immediate attention' :
             riskScore > 40 ? 'Medium risk needs monitoring' : 'Low risk, well-managed supplier'}
          </p>
        </div>
      </div>

      {/* Tab Navigation - Compact */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-2 border-b-2 font-medium ${compact ? 'text-sm' : 'text-base'} transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center space-x-2">
                <span className={compact ? 'text-sm' : 'text-base'}>{tab.icon}</span>
                <span>{tab.label}</span>
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content - Optimized for space */}
      <div className={`card-elevated ${cardPadding}`}>
        {activeTab === 'overview' && (
          <div className={compact ? 'space-y-4' : 'space-y-6'}>
            <div>
              <h3 className={`${compact ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 mb-4`}>Supplier Information</h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Company Name</label>
                    <p className={`${compact ? 'text-sm' : 'text-base'} text-gray-900 font-medium`}>{data.supplier_name || 'Unknown Supplier'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Risk Level</label>
                    <p className={`${compact ? 'text-sm' : 'text-base'} text-gray-900 font-medium`}>{data.risk_level || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Risk Score</label>
                    <p className={`${compact ? 'text-sm' : 'text-base'} text-gray-900 font-medium`}>{riskScore}/100</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Analysis Date</label>
                    <p className={`${compact ? 'text-sm' : 'text-base'} text-gray-900 font-medium`}>{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-gray-900 mb-3`}>Key Risk Factors</h4>
                <div className="space-y-2">
                  {data.factors && data.factors.length > 0 ? (
                    data.factors.slice(0, compact ? 3 : 5).map((factor, index) => (
                      <div key={index} className="flex items-start space-x-2 p-2 bg-red-50 rounded-lg">
                        <span className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className={`${compact ? 'text-xs' : 'text-sm'} text-gray-700`}>{factor}</span>
                      </div>
                    ))
                  ) : (
                    <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>No specific risk factors identified</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-gray-900 mb-3`}>Top Recommendations</h4>
                <div className="space-y-2">
                  {data.recommendations && data.recommendations.length > 0 ? (
                    data.recommendations.slice(0, compact ? 3 : 5).map((rec, index) => (
                      <div key={index} className="flex items-start space-x-2 p-2 bg-blue-50 rounded-lg">
                        <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className={`${compact ? 'text-xs' : 'text-sm'} text-gray-700`}>{rec}</span>
                      </div>
                    ))
                  ) : (
                    <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>No specific recommendations available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'factors' && (
          <div>
            <h3 className={`${compact ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 mb-4`}>Identified Risk Factors</h3>
            {data.factors && data.factors.length > 0 ? (
              <div className="space-y-3">
                {data.factors.map((factor, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-red-600 text-xs font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className={`text-gray-900 leading-relaxed ${compact ? 'text-sm' : 'text-base'}`}>{factor}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✅</div>
                <h4 className={`${compact ? 'text-lg' : 'text-xl'} font-medium text-gray-900 mb-3`}>No Major Risk Factors</h4>
                <p className={`text-gray-600 ${compact ? 'text-sm' : 'text-base'}`}>This supplier shows no significant risk factors in our analysis.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div>
            <h3 className={`${compact ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 mb-4`}>Recommended Actions</h3>
            {data.recommendations && data.recommendations.length > 0 ? (
              <div className="space-y-3">
                {data.recommendations.map((rec, index) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-blue-600 text-xs font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className={`text-gray-900 leading-relaxed ${compact ? 'text-sm' : 'text-base'}`}>{rec}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">👍</div>
                <h4 className={`${compact ? 'text-lg' : 'text-xl'} font-medium text-gray-900 mb-3`}>No Specific Recommendations</h4>
                <p className={`text-gray-600 ${compact ? 'text-sm' : 'text-base'}`}>This supplier appears to be well-managed with standard risk levels.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons - Compact */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          onClick={() => onAIChatToggle?.(true)}
          className={`btn-primary flex-1 ${compact ? 'text-sm py-3' : 'text-base py-4'}`}
        >
          <span className="flex items-center justify-center space-x-2">
            <svg className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Ask AI Assistant</span>
          </span>
        </button>
        
        <button className={`btn-secondary flex-1 ${compact ? 'text-sm py-3' : 'text-base py-4'}`}>
          <span className="flex items-center justify-center space-x-2">
            <svg className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export Report</span>
          </span>
        </button>
      </div>
    </div>
  );
}

