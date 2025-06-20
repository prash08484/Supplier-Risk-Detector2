'use client';

interface SupplierReportProps {
  data?: {
    supplier_name?: string;
    risk_score?: number;
    risk_level?: string;
    factors?: string[];
    recommendations?: string[];
  };
}

export default function SupplierReport({ data }: SupplierReportProps) {
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
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
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
              {data.risk_score || 0}/100
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
      </div>
    </div>
  );
}