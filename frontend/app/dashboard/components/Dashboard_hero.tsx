import React, { useEffect, useState, useRef } from "react";
import Chart from "chart.js/auto";

interface NewsItem {
  id: number;
  title: string;
  source: string;
  date: string;
  sentiment: "negative" | "positive" | "neutral";
  supplier: string;
  summary: string;
  riskScore: number;
}

interface Supplier {
  id: string;
  name: string;
  riskScore: string;
}

interface DashboardHeroProps {
  suppliers: Supplier[];
}

const DashboardHero: React.FC<DashboardHeroProps> = ({ suppliers }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<'news' | 'trends'>('news');
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    const generateNews = () => {
      const newsTemplates = [
        { type: 'positive', templates: ['reports strong quarterly results', 'announces new sustainability initiative', 'receives industry award', 'expands operations globally'] },
        { type: 'negative', templates: ['faces regulatory challenges', 'reports supply chain disruption', 'under investigation for compliance', 'experiences data breach'] },
        { type: 'neutral', templates: ['releases quarterly report', 'announces leadership change', 'updates corporate strategy', 'publishes sustainability report'] }
      ];

      const sources = ["Financial Times", "Wall Street Journal", "TechCrunch", "Reuters", "Bloomberg", "Industry Weekly"];
      
      const generatedNews = suppliers.map((supplier, index) => {
        const sentimentType = Math.random() > 0.7 ? 'negative' : Math.random() > 0.5 ? 'positive' : 'neutral';
        const templates = newsTemplates.find(t => t.type === sentimentType)?.templates || [];
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        return {
          id: index + 1,
          title: `${supplier.name} ${template}`,
          source: sources[Math.floor(Math.random() * sources.length)],
          date: `${Math.floor(Math.random() * 24)} hours ago`,
          sentiment: sentimentType as "negative" | "positive" | "neutral",
          supplier: supplier.name,
          summary: `Latest updates about ${supplier.name} show ${Math.random() > 0.5 ? "improving" : "declining"} performance metrics across key operational areas.`,
          riskScore: parseFloat(supplier.riskScore) / 100,
        };
      });
      
      setNews(generatedNews);
      setLoading(false);
    };

    if (suppliers.length > 0) {
      generateNews();
    }
  }, [suppliers]);

  useEffect(() => {
    if (!chartRef.current) return;
    
    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [
          {
            label: "High Risk Events",
            data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 8) + 2),
            borderColor: "#ef4444",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            tension: 0.4,
            fill: true,
            pointBackgroundColor: "#ef4444",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: "Medium Risk Events",
            data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 12) + 5),
            borderColor: "#f59e0b",
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            tension: 0.4,
            fill: true,
            pointBackgroundColor: "#f59e0b",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: "Low Risk Events",
            data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 15) + 8),
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            tension: 0.4,
            fill: true,
            pointBackgroundColor: "#10b981",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12,
                weight: 500
              }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#374151',
            bodyColor: '#6b7280',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 11
              },
              color: '#6b7280'
            }
          },
          y: {
            grid: {
              color: 'rgba(229, 231, 235, 0.5)',
            },
            ticks: {
              font: {
                size: 11
              },
              color: '#6b7280'
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [activeView]);

  const filteredNews = supplierFilter === "all" 
    ? news 
    : news.filter(item => item.supplier === supplierFilter);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '📈';
      case 'negative':
        return '📉';
      default:
        return '📊';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'border-green-500 bg-green-50';
      case 'negative':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Risk Intelligence Center</h2>
          <p className="text-gray-600">Real-time insights and market intelligence</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          <div className="bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveView('news')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeView === 'news' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📰 News Feed
            </button>
            <button
              onClick={() => setActiveView('trends')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeView === 'trends' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Risk Trends
            </button>
          </div>

          {/* Filter Dropdown */}
          {activeView === 'news' && (
            <div className="relative">
              <select
                className="appearance-none bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
              >
                <option value="all">All Suppliers</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.name}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="card-elevated overflow-hidden">
        {activeView === 'news' ? (
          <>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <span className="text-blue-600">📰</span>
                  <span>Latest Market Intelligence</span>
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live Updates</span>
                </div>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-6 space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex space-x-4">
                      <div className="loading-skeleton w-12 h-12 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="loading-skeleton h-4 w-3/4"></div>
                        <div className="loading-skeleton h-3 w-1/2"></div>
                        <div className="loading-skeleton h-3 w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredNews.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-4">📰</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No news found</h3>
                  <p className="text-gray-600">Try adjusting your filter or check back later</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredNews.map((item) => (
                    <div
                      key={item.id}
                      className={`p-6 hover:bg-gray-50 transition-colors duration-200 border-l-4 ${getSentimentColor(item.sentiment)}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getSentimentIcon(item.sentiment)}</span>
                          <div>
                            <span className="text-sm font-semibold text-gray-900">{item.supplier}</span>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>{item.source}</span>
                              <span>•</span>
                              <span>{item.date}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.riskScore > 0.7 ? 'bg-red-100 text-red-800' :
                          item.riskScore > 0.4 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          Risk: {(item.riskScore * 100).toFixed(0)}%
                        </span>
                      </div>
                      
                      <h4 className="font-medium text-gray-900 mb-2 leading-snug">{item.title}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{item.summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <span className="text-purple-600">📊</span>
                <span>Risk Event Trends (Last 30 Days)</span>
              </h3>
            </div>
            
            <div className="p-6">
              <div className="h-80">
                <canvas ref={chartRef}></canvas>
              </div>
              
              {/* Trend Summary */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-red-800">High Risk Events</span>
                  </div>
                  <div className="text-2xl font-bold text-red-900">127</div>
                  <div className="text-xs text-red-600">+12% from last month</div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium text-yellow-800">Medium Risk Events</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-900">284</div>
                  <div className="text-xs text-yellow-600">-5% from last month</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-800">Low Risk Events</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">356</div>
                  <div className="text-xs text-green-600">+8% from last month</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardHero;

