
'use client';

import { useState, useEffect } from 'react';
import SupplierForm from '../../../components/SupplierForm';
import SupplierReport from '../../../components/SupplierReport';
import DashboardHero from './Dashboard_hero';
import Navbar from '../../navbar';
import AIChat from '../../../components/AIChat';

interface Supplier {
  id: string;
  name: string;
  riskScore: string;
  createdAt: string;
}

export default function DashboardContent() {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAIChat, setShowAIChat] = useState(false);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch('/api/suppliers');
        const data = await response.json();
        setSuppliers(data);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  const riskMetrics = [
    { 
      label: 'High Risk Suppliers', 
      value: suppliers.filter(s => parseFloat(s.riskScore) > 70).length,
      color: 'danger',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      trend: '+2.3%'
    },
    { 
      label: 'Medium Risk Suppliers', 
      value: suppliers.filter(s => parseFloat(s.riskScore) > 40 && parseFloat(s.riskScore) <= 70).length,
      color: 'warning',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      trend: '-1.2%'
    },
    { 
      label: 'Low Risk Suppliers', 
      value: suppliers.filter(s => parseFloat(s.riskScore) <= 40).length,
      color: 'success',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      trend: '+5.7%'
    },
    { 
      label: 'Total Suppliers', 
      value: suppliers.length,
      color: 'primary',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-2-5h6m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v6.5M7 7h3v3H7V7z" />
        </svg>
      ),
      trend: '+12.4%'
    },
  ];

  const navigationItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-2-5h6m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v6.5M7 7h3v3H7V7z" />
        </svg>
      )
    },
    {
      id: 'risks',
      label: 'Risk Analysis',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  const handleAnalysisComplete = (data: any) => {
    setAnalysisData(data);
    setAnalysisHistory((prev) => [data, ...prev]);
    setActiveTab('risks');
  };

  const handleAIChatToggle = (show: boolean) => {
    setShowAIChat(show);
  };

  const getMetricColorClasses = (color: string) => {
    const colorMap = {
      danger: 'bg-red-50 border-red-200 text-red-700',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      success: 'bg-green-50 border-green-200 text-green-700',
      primary: 'bg-blue-50 border-blue-200 text-blue-700'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.primary;
  };

  const getIconColorClasses = (color: string) => {
    const colorMap = {
      danger: 'text-red-600 bg-red-100',
      warning: 'text-yellow-600 bg-yellow-100',
      success: 'text-green-600 bg-green-100',
      primary: 'text-blue-600 bg-blue-100'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.primary;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="flex pt-16">
        {/* Left Panel - Always Visible */}
        <div className="w-72 bg-white/80 backdrop-blur-sm shadow-lg min-h-screen border-r border-gray-200/50 flex-shrink-0">
          <div className="p-6">
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Dashboard</h2>
              <p className="text-sm text-gray-600">Manage your supplier risks</p>
            </div>
            
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`sidebar-item w-full ${
                    activeTab === item.id ? 'active' : ''
                  }`}
                >
                  <span className={`p-2 rounded-lg ${
                    activeTab === item.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Quick Actions */}
            <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setActiveTab('suppliers')}
                  className="w-full text-left text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Add New Supplier
                </button>
                <button 
                  onClick={() => setActiveTab('risks')}
                  className="w-full text-left text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  📊 Run Risk Analysis
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area - Optimized for remaining space */}
        <div className="flex-1 min-w-0 p-6 overflow-hidden">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
                  <p className="text-gray-600">Monitor your supplier risk landscape</p>
                </div>
                <div className="flex space-x-3">
                  <button className="btn-secondary text-sm py-2 px-4">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Report
                  </button>
                  <button className="btn-primary text-sm py-2 px-4">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Data
                  </button>
                </div>
              </div>

              {/* Enhanced Dashboard Hero */}
              <DashboardHero suppliers={suppliers} />

              {/* Enhanced Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {riskMetrics.map((metric, idx) => (
                  <div key={idx} className={`metric-card ${getMetricColorClasses(metric.color)} border-l-4`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-lg ${getIconColorClasses(metric.color)}`}>
                        {metric.icon}
                      </div>
                      <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                        metric.trend.startsWith('+') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {metric.trend}
                      </div>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">{metric.label}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced Suppliers Table */}
              <div className="card-elevated">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Suppliers</h2>
                    <button 
                      onClick={() => setActiveTab('suppliers')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View All →
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <div className="loading-skeleton w-12 h-12 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="loading-skeleton h-4 w-3/4"></div>
                            <div className="loading-skeleton h-3 w-1/2"></div>
                          </div>
                          <div className="loading-skeleton h-6 w-16 rounded-full"></div>
                        </div>
                      ))}
                    </div>
                  ) : suppliers.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-2-5h6m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v6.5M7 7h3v3H7V7z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers yet</h3>
                      <p className="text-gray-600 mb-4">Get started by adding your first supplier</p>
                      <button 
                        onClick={() => setActiveTab('suppliers')}
                        className="btn-primary"
                      >
                        Add Supplier
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {suppliers.slice(0, 5).map((supplier) => (
                        <div key={supplier.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {supplier.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{supplier.name}</p>
                              <p className="text-xs text-gray-500">
                                Risk Level: {parseFloat(supplier.riskScore) > 70 ? 'High' : 
                                           parseFloat(supplier.riskScore) > 40 ? 'Medium' : 'Low'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">{supplier.riskScore}/100</div>
                              <div className="text-xs text-gray-500">Risk Score</div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              parseFloat(supplier.riskScore) > 70 ? 'risk-badge-high' :
                              parseFloat(supplier.riskScore) > 40 ? 'risk-badge-medium' : 'risk-badge-low'
                            }`}>
                              {parseFloat(supplier.riskScore) > 70 ? 'High' :
                               parseFloat(supplier.riskScore) > 40 ? 'Medium' : 'Low'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Supplier Management</h1>
                <p className="text-gray-600">Add and analyze your suppliers</p>
              </div>
              <div className="card-elevated p-6">
                <SupplierForm onAnalysisComplete={handleAnalysisComplete} />
              </div>
            </div>
          )}

          {activeTab === 'risks' && (
            <div className="space-y-6 h-full">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {analysisData && (
                    <button
                      onClick={() => {
                        setAnalysisData(null);
                        setShowAIChat(false);
                      }}
                      className="btn-ghost flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Back</span>
                    </button>
                  )}
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                      {analysisData ? 'Analysis Results' : 'Risk Analysis'}
                    </h1>
                    <p className="text-gray-600 text-sm">
                      {analysisData ? 'Detailed supplier risk assessment' : 'Analyze supplier risks and get insights'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-h-0">
                {analysisData ? (
                  // Optimized report layout for available space
                  <div className="h-full overflow-auto">
                    <SupplierReport 
                      data={analysisData} 
                      onAIChatToggle={handleAIChatToggle}
                      compact={true}
                    />
                  </div>
                ) : (
                  // Form when no analysis data
                  <div className="card-elevated p-6">
                    <SupplierForm onAnalysisComplete={handleAnalysisComplete} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Chat - Fixed Bottom Right Position */}
      {showAIChat && analysisData && (
        <div className="fixed bottom-4 right-4 z-50">
          <AIChat
            url={analysisData.normalized_url || ''}
            name={analysisData.supplier_name || ''}
            riskScore={(analysisData.risk_score ?? 0).toFixed(1)}
            onClose={() => setShowAIChat(false)}
          />
        </div>
      )}
    </div>
  );
}


