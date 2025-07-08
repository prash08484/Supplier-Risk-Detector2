'use client';

import SupplierForm from '../../../components/SupplierForm';
import SupplierReport from '../../../components/SupplierReport';
import ThemeToggle from '../../../components/ThemeToggle';
import Dashboard_hero from './Dashboard_hero';
import { UserButton } from '@clerk/nextjs';
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../../navbar';

export default function DashboardContent() {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  const riskMetrics = [
    { label: 'High Risk Suppliers', value: '12', change: '+2', color: 'text-red-600' },
    { label: 'Medium Risk Suppliers', value: '45', change: '-3', color: 'text-yellow-600' },
    { label: 'Low Risk Suppliers', value: '234', change: '+8', color: 'text-green-600' },
    { label: 'Total Suppliers', value: '291', change: '+7', color: 'text-blue-600' },
  ];

  const recentAlerts = [
    { id: 1, supplier: 'Acme Corp', risk: 'Financial', severity: 'High', date: '2024-01-15' },
    { id: 2, supplier: 'Global Tech', risk: 'Compliance', severity: 'Medium', date: '2024-01-14' },
    { id: 3, supplier: 'Supply Co', risk: 'Operational', severity: 'High', date: '2024-01-13' },
    { id: 4, supplier: 'Best Materials', risk: 'Financial', severity: 'Low', date: '2024-01-12' },
  ];

  const handleAnalysisComplete = (data: any) => {
    setAnalysisData(data);
    setAnalysisHistory((prev) => [data, ...prev]);
    setActiveTab('risks');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navbar />

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-4">
            <nav className="space-y-2">
              {['overview', 'suppliers', 'risks'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full text-left px-4 py-2 rounded-lg ${
                    activeTab === tab
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab === 'overview' ? 'Overview' : tab === 'suppliers' ? 'Suppliers' : 'Risk Analysis'}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {activeTab === 'overview' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Overview</h1>
              
              {/* Hero Section */}
              <Dashboard_hero />

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
                {riskMetrics.map((metric, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">{metric.label}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                      <span className={`text-sm ${metric.color}`}>{metric.change}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Latest Analyzed Suppliers */}
              <div className="bg-white rounded-lg shadow-sm mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Latest Analyzed Suppliers</h2>
                </div>
                <div className="p-6">
                  <ul className="divide-y divide-gray-200">
                    {analysisHistory.slice(0, 5).map((item, idx) => (
                      <li key={idx} className="py-2 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{item.supplier_name}</p>
                          <p className="text-sm text-gray-500">{item.risk_level} Risk</p>
                        </div>
                        <div className="text-sm text-gray-700">{item.risk_score}/100</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recent Alerts */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Risk Alerts</h2>
                </div>
                <div className="p-6 space-y-4">
                  {recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            alert.severity === 'High'
                              ? 'bg-red-500'
                              : alert.severity === 'Medium'
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">{alert.supplier}</h4>
                          <p className="text-sm text-gray-600">{alert.risk} Risk</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            alert.severity === 'High'
                              ? 'bg-red-100 text-red-800'
                              : alert.severity === 'Medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">{alert.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Supplier Management</h1>
              <div className="space-y-6">
                <SupplierForm onAnalysisComplete={handleAnalysisComplete} />
              </div>
            </div>
          )}

          {activeTab === 'risks' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Risk Analysis</h1>
              <div className="space-y-6">
                <SupplierForm onAnalysisComplete={handleAnalysisComplete} />
                <SupplierReport data={analysisData} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
