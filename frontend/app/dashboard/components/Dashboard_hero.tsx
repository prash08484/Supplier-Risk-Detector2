import React, {
  useEffect,
  useState,
  useRef,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import Chart from "chart.js/auto";

type Sentiment = "negative" | "positive" | "neutral";

interface NewsItem {
  id: number;
  title: string;
  source: string;
  date: string;
  sentiment: Sentiment;
  supplier: string;
  summary: string;
  url: string;
  riskScore: number;
}

interface AlertItem {
  id: number;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const sampleNews: NewsItem[] = [
  {
    id: 1,
    title:
      "Acme Corp faces regulatory scrutiny over environmental violations",
    source: "Financial Times",
    date: "2 hours ago",
    sentiment: "negative",
    supplier: "Acme Corp",
    summary:
      "Environmental regulators have launched an investigation into Acme Corp's manufacturing facilities following multiple complaints about waste disposal practices.",
    url: "#",
    riskScore: 0.87,
  },
  {
    id: 2,
    title: "Globex announces record profits in Q2 earnings report",
    source: "Wall Street Journal",
    date: "5 hours ago",
    sentiment: "positive",
    supplier: "Globex",
    summary:
      "Globex reported a 15% increase in quarterly profits, exceeding analyst expectations and signaling strong market performance.",
    url: "#",
    riskScore: 0.12,
  },
  {
    id: 3,
    title: "Initech CEO steps down amid restructuring",
    source: "TechCrunch",
    date: "1 day ago",
    sentiment: "neutral",
    supplier: "Initech",
    summary:
      "Initech's long-time CEO has announced his retirement as the company undergoes a major organizational restructuring.",
    url: "#",
    riskScore: 0.45,
  },
  {
    id: 4,
    title: "Labor strike at Acme Corp warehouses disrupts supply chain",
    source: "Reuters",
    date: "1 day ago",
    sentiment: "negative",
    supplier: "Acme Corp",
    summary:
      "Warehouse workers at Acme Corp have gone on strike, demanding better wages and working conditions, causing delays in shipments.",
    url: "#",
    riskScore: 0.78,
  },
  {
    id: 5,
    title: "Globex awarded major government contract",
    source: "Government Procurement News",
    date: "2 days ago",
    sentiment: "positive",
    supplier: "Globex",
    summary:
      "Globex has secured a $200M contract with the Department of Defense to supply critical components for defense systems.",
    url: "#",
    riskScore: 0.05,
  },
];

const sampleAlerts: AlertItem[] = [
  {
    id: 1,
    title: "High Risk Alert: Acme Corp",
    message:
      "Multiple negative news articles detected with high risk scores",
    timestamp: "10 minutes ago",
    read: false,
  },
  {
    id: 2,
    title: "New Analysis Available",
    message: "Updated risk assessment for Globex is ready for review",
    timestamp: "1 hour ago",
    read: false,
  },
  {
    id: 3,
    title: "Monitoring Alert: Initech",
    message: "CEO transition may impact supplier stability",
    timestamp: "3 hours ago",
    read: true,
  },
];

const sentimentTrendData = {
  labels: Array.from({ length: 30 }, (_, i) => `${i + 1} days ago`).reverse(),
  datasets: [
    {
      label: "Negative Sentiment",
      data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 10)),
      borderColor: "#ef4444",
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      tension: 0.3,
      fill: true,
    },
    {
      label: "Positive Sentiment",
      data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 15)),
      borderColor: "#10b981",
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      tension: 0.3,
      fill: true,
    },
    {
      label: "Neutral Sentiment",
      data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 20)),
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      tension: 0.3,
      fill: true,
    },
  ],
};

// Custom CSS for hover and border-left colors and pulse animation
const style = `
  .news-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .news-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  }
  .negative-sentiment {
    border-left: 4px solid #ef4444;
  }
  .positive-sentiment {
    border-left: 4px solid #10b981;
  }
  .neutral-sentiment {
    border-left: 4px solid #3b82f6;
  }
  .pulse-animation {
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
`;

export default function Dashboard_hero(): JSX.Element {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [sentimentFilter, setSentimentFilter] = useState<Sentiment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>("Just now");
  const [alertsDropdownOpen, setAlertsDropdownOpen] = useState<boolean>(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);

  const alertCount = alerts.filter((a) => !a.read).length;

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Inject style once
  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.textContent = style;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  // Load news feed with filters and simulate delay
  function loadNewsFeed(
    filterSupplier: string = "all",
    filterSentiment: Sentiment | null = null
  ) {
    setLoading(true);
    setTimeout(() => {
      let filteredNews = sampleNews;

      if (filterSupplier !== "all") {
        filteredNews = filteredNews.filter((news) =>
          news.supplier.toLowerCase().includes(filterSupplier.toLowerCase())
        );
      }

      if (filterSentiment) {
        filteredNews = filteredNews.filter(
          (news) => news.sentiment === filterSentiment
        );
      }

      setNews(filteredNews);
      setLastUpdated("Just now");
      setLoading(false);
    }, 800);
  }

  // Setup alerts from sample data
  function setupAlerts() {
    setAlerts(sampleAlerts);
  }

  // Initialize Chart.js chart
  function initializeChart() {
    if (!chartRef.current) return;
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    chartInstance.current = new Chart(chartRef.current, {
      type: "line",
      data: sentimentTrendData,
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
          },
          title: {
            display: false,
          },
        },
        scales: {
          x: {
            display: true,
            title: {
              display: false,
            },
          },
          y: {
            display: true,
            title: {
              display: false,
            },
            beginAtZero: true,
          },
        },
      },
    });
  }

  // Simulate real-time updates for last updated time
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated("Just now");
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load initial data and setup alerts/chart
  useEffect(() => {
    loadNewsFeed(supplierFilter, sentimentFilter);
    setupAlerts();
    initializeChart();
  }, []);

  // Reload news when filters change
  useEffect(() => {
    loadNewsFeed(supplierFilter, sentimentFilter);
  }, [supplierFilter, sentimentFilter]);

  // Close alerts dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (
        !target.closest("#alertsBtn") &&
        !target.closest("#alertsDropdown")
      ) {
        setAlertsDropdownOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Mark alert as read and show modal
  function onAlertClick(alert: AlertItem) {
    setSelectedAlert(alert);
    setAlertsDropdownOpen(false);
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alert.id ? { ...a, read: true } : a
      )
    );
  }

  // Close alert modal
  function closeAlertModal() {
    setSelectedAlert(null);
  }

  // Risk color based on riskScore
  function getRiskColor(riskScore: number) {
    if (riskScore > 0.7) return "bg-red-100 text-red-800";
    if (riskScore > 0.4) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  }

  // Keyboard handler for alert items
  function handleAlertKeyDown(
    e: KeyboardEvent<HTMLDivElement>,
    alert: AlertItem
  ) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onAlertClick(alert);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 mb-8">
      {/* Header */}
      <header className="bg-white shadow-sm text-gray-900 mb-8">
        {/* <div className="max-w-7xl mx-auto px-1 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            
          </h1>
          <div className="flex items-center space-x-4 relative text-gray-900 mb-8">
            <button
              id="alertsBtn"
              className={`p-2 rounded-full bg-gray-100 hover:bg-gray-200 relative text-gray-900 mb-8 ${
                alertCount > 0 ? "pulse-animation" : ""
              }`}
              onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                setAlertsDropdownOpen((v) => !v);
              }}
              aria-label="Alerts"
              type="button"
            >
              <i className="fas fa-bell text-gray-600"></i>
              {alertCount > 0 && (
                <span
                  id="alertCount"
                  className="absolute -top-1 -right-1 text-gray-900 mb-8 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                >
                  {alertCount}
                </span>
              )}
            </button>
            {alertsDropdownOpen && (
              <div
                id="alertsDropdown"
                className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-10 max-h-60 overflow-y-auto"
              >
                <div className="p-3 border-b">
                  <h3 className="font-medium text-gray-900 mb-8">Recent Alerts</h3>
                </div>
                {alerts.length === 0 && (
                  <div className="p-3 text-gray-500 text-sm">
                    No alerts available.
                  </div>
                )}
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                      !alert.read ? "font-semibold" : "font-normal"
                    }`}
                    onClick={() => onAlertClick(alert)}
                    tabIndex={0}
                    onKeyDown={(e) => handleAlertKeyDown(e, alert)}
                    role="button"
                    aria-pressed="false"
                  >
                    <div className="flex justify-between items-center">
                      <span>{alert.title}</span>
                      <span className="text-xs text-gray-400">
                        {alert.timestamp}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {alert.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div> */}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Supplier News Feed
          </h2>
          <div className="flex space-x-3">
            <div className="relative">
              <select 
                id="supplierFilter"
                className="cursor-pointer appearance-none bg-white border text-gray-900 mb-8 border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors hover:border-blue-400"

                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                aria-label="Filter by supplier"
              >
                <option value="all">All Suppliers</option>
                <option value="supplier1">Acme Corp</option>
                <option value="supplier2">Globex</option>
                <option value="supplier3">Initech</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <i className="fas fa-chevron-down text-xs"></i>
              </div>
            </div>
            <button
              id="refreshBtn"
              className="btn btn-primary btn-sm"
              onClick={() => loadNewsFeed(supplierFilter, sentimentFilter)}
              type="button"
              aria-label="Refresh news feed"
            >
              <i className="fas fa-sync-alt mr-2 "></i>
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Articles</p>
                <p className="text-2xl font-bold">{news.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <i className="fas fa-newspaper text-blue-600"></i>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Negative Sentiment</p>
                <p className="text-2xl font-bold text-red-600">
                  {news.filter((n) => n.sentiment === "negative").length}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <i className="fas fa-exclamation-triangle text-red-600"></i>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Positive Sentiment</p>
                <p className="text-2xl font-bold text-green-600">
                  {news.filter((n) => n.sentiment === "positive").length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <i className="fas fa-thumbs-up text-green-600"></i>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-1xl font-bold">{lastUpdated}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <i className="fas fa-clock text-purple-600"></i>
              </div>
            </div>
          </div>
        </div>

        {/* News Feed */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="border-b border-gray-200 px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h3 className="font-medium text-gray-700">Latest News</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Filter by:</span>
              <div className="flex space-x-1">
                <button
                  className={`sentiment-filter px-2 py-1 text-xs rounded-full ${
                    sentimentFilter === "negative"
                      ? "bg-red-600 text-white"
                      : "bg-red-100 text-red-800"
                  }`}
                  data-sentiment="negative"
                  onClick={() =>
                    setSentimentFilter(
                      sentimentFilter === "negative" ? null : "negative"
                    )
                  }
                  type="button"
                  aria-pressed={sentimentFilter === "negative"}
                >
                  Negative
                </button>
                <button
                  className={`sentiment-filter px-2 py-1 text-xs rounded-full ${
                    sentimentFilter === "positive"
                      ? "bg-green-600 text-white"
                      : "bg-green-100 text-green-800"
                  }`}
                  data-sentiment="positive"
                  onClick={() =>
                    setSentimentFilter(
                      sentimentFilter === "positive" ? null : "positive"
                    )
                  }
                  type="button"
                  aria-pressed={sentimentFilter === "positive"}
                >
                  Positive
                </button>
                <button
                  className={`sentiment-filter px-2 py-1 text-xs rounded-full ${
                    sentimentFilter === "neutral"
                      ? "bg-blue-600 text-white"
                      : "bg-blue-100 text-blue-800"
                  }`}
                  data-sentiment="neutral"
                  onClick={() =>
                    setSentimentFilter(
                      sentimentFilter === "neutral" ? null : "neutral"
                    )
                  }
                  type="button"
                  aria-pressed={sentimentFilter === "neutral"}
                >
                  Neutral
                </button>
              </div>
            </div>
          </div>
          <div id="newsContainer" className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <i className="fas fa-spinner fa-spin mr-2"></i> Loading news feed...
              </div>
            ) : news.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No news articles found matching your criteria.
              </div>
            ) : (
              news.map((newsItem) => {
                const sentimentClass =
                  newsItem.sentiment === "negative"
                    ? "negative-sentiment"
                    : newsItem.sentiment === "positive"
                    ? "positive-sentiment"
                    : "neutral-sentiment";
                const riskColor = getRiskColor(newsItem.riskScore);
                return (
                  <div
                    key={newsItem.id}
                    className={`news-card p-4 transition duration-200 ${sentimentClass} flex justify-between items-start`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center mb-1 flex-wrap gap-1 sm:gap-2">
                        <span className="text-sm font-medium text-gray-700">
                          {newsItem.supplier}
                        </span>
                        <span className="mx-2 text-gray-400 hidden sm:inline">•</span>
                        <span className="text-xs text-gray-500">{newsItem.date}</span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        {newsItem.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">{newsItem.summary}</p>
                      <div className="flex items-center flex-wrap gap-1 sm:gap-2">
                        <span className="text-xs text-gray-500">
                          Source: {newsItem.source}
                        </span>
                        <span className="mx-2 text-gray-400 hidden sm:inline">•</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${riskColor}`}
                        >
                          Risk: {(newsItem.riskScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 self-center">
                      <a
                        href={newsItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                        aria-label={`Read more about ${newsItem.title}`}
                      >
                        <i className="fas fa-external-link-alt"></i>
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Historical Trends Section */}
        <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
          <div className="border-b border-gray-200 px-4 py-3">
            <h3 className="font-medium text-gray-700">
              Sentiment Trends (Last 30 Days)
            </h3>
          </div>
          <div className="p-4">
            <canvas id="sentimentChart" height={200} ref={chartRef}></canvas>
          </div>
        </div>
      </main>

      {/* Alert Modal */}
      {selectedAlert && (
        <div
          id="alertModal"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAlertModal();
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="alertModalTitle"
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b">
              <h3 id="alertModalTitle" className="text-lg font-medium">
                New Risk Alert
              </h3>
            </div>
            <div className="p-4">
              <h4 className="font-semibold mb-2">{selectedAlert.title}</h4>
              <p className="mb-2">{selectedAlert.message}</p>
              <span className="text-xs text-gray-400">
                {selectedAlert.timestamp}
              </span>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                id="closeAlertModal"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={closeAlertModal}
                type="button"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}