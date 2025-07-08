'use client';

import { useState } from 'react';
import { analyzeSupplier } from '../lib/api';
import { normalizeUrl } from '../lib/normalizeUrl'; // ✅ import the helper

interface SupplierFormProps {
  onAnalysisComplete: (data: any) => void;
}

export default function SupplierForm({ onAnalysisComplete }: SupplierFormProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // ✅ Normalize the URL before sending it
      const normalized = normalizeUrl(url);
      if (!normalized) {
        throw new Error('Invalid URL');
      }

      const result = await analyzeSupplier(normalized);

      if (result.success && result.data) {
        const normalizedData = {
          supplier_name: result.data.company_name,
          risk_score: result.data.analysis.sustainability_score * 10, // 0-10 to 0-100 scale
          risk_level: result.data.analysis.risk_level,
          factors: result.data.analysis.key_findings,
          recommendations: result.data.analysis.recommendations,
        };

        onAnalysisComplete(normalizedData);
      } else {
        setError(result?.error || 'Analysis failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700">
          Supplier Website URL
        </label>
        <input
          type="url"
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          required
          className="mt-1 p-2 border border-gray-300 rounded w-full"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>
    </form>
  );
}
