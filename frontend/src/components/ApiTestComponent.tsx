import { useState, useEffect } from 'react';

export default function ApiTestComponent() {
  const [status, setStatus] = useState<string>('Testing...');
  const [apiUrl, setApiUrl] = useState<string>('');

  useEffect(() => {
    const testApi = async () => {
      const url = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      setApiUrl(url);
      
      try {
        const response = await fetch(`${url.replace('/api', '/health/')}`);
        if (response.ok) {
          const data = await response.json();
          setStatus(`✅ Connected: ${data.service} v${data.version}`);
        } else {
          setStatus(`❌ Error: ${response.status}`);
        }
      } catch (error) {
        setStatus(`❌ Failed: ${error.message}`);
      }
    };

    testApi();
  }, []);

  return (
    <div className="bg-gray-100 p-4 rounded-lg border">
      <h3 className="font-bold text-lg mb-2">🔗 API Connection Test</h3>
      <p className="text-sm text-gray-600 mb-2">Backend URL: {apiUrl}</p>
      <p className="font-medium">{status}</p>
    </div>
  );
}