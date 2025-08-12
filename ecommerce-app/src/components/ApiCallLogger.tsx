import React from 'react';

interface ApiCallLoggerProps {
  onApiCall?: (url: string, timestamp: number) => void;
}

// Component to track and display API calls
export const ApiCallLogger: React.FC<ApiCallLoggerProps> = ({ onApiCall }) => {
  const [apiCalls, setApiCalls] = React.useState<Array<{ url: string; timestamp: number; id: number }>>([]);

  React.useEffect(() => {
    // Intercept fetch calls to log them
    const originalFetch = window.fetch;
    let callId = 0;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const timestamp = Date.now();
      const currentCallId = ++callId;

      // Only log DummyJSON API calls
      if (url.includes('dummyjson.com')) {
        console.log(`🌐 API Call #${currentCallId}:`, url);
        
        setApiCalls(prev => [...prev, { url, timestamp, id: currentCallId }]);
        onApiCall?.(url, timestamp);
      }

      return originalFetch(input, init);
    };

    // Cleanup
    return () => {
      window.fetch = originalFetch;
    };
  }, [onApiCall]);

  const clearLog = () => {
    setApiCalls([]);
  };

  const getSkipValue = (url: string) => {
    const match = url.match(/skip=(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const getQueryType = (url: string) => {
    if (url.includes('/search?')) return 'Search';
    if (url.includes('/category/')) return 'Category';
    return 'All Products';
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      width: '350px',
      maxHeight: '400px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      overflowY: 'auto',
      fontFamily: 'monospace'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ margin: 0, color: '#4ade80' }}>🔍 API Call Monitor</h4>
        <button 
          onClick={clearLog}
          style={{
            background: '#ef4444',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '10px'
          }}
        >
          Clear
        </button>
      </div>
      
      <div style={{ marginBottom: '10px', color: '#fbbf24' }}>
        Total Calls: {apiCalls.length}
      </div>

      {apiCalls.length === 0 ? (
        <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>
          No API calls yet...
        </div>
      ) : (
        <div>
          {apiCalls.slice(-10).map((call) => {
            const skip = getSkipValue(call.url);
            const type = getQueryType(call.url);
            const timeStr = new Date(call.timestamp).toLocaleTimeString();
            
            return (
              <div 
                key={call.id}
                style={{
                  padding: '8px',
                  margin: '4px 0',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  borderLeft: `3px solid ${skip === 0 ? '#10b981' : '#3b82f6'}`
                }}
              >
                <div style={{ color: '#e5e7eb', fontWeight: 'bold' }}>
                  #{call.id} - {type}
                </div>
                <div style={{ color: skip === 0 ? '#10b981' : '#3b82f6' }}>
                  Skip: {skip} | Page: {skip / 6}
                </div>
                <div style={{ color: '#9ca3af', fontSize: '10px' }}>
                  {timeStr}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {apiCalls.length > 10 && (
        <div style={{ color: '#9ca3af', fontSize: '10px', marginTop: '8px' }}>
          Showing last 10 calls...
        </div>
      )}
    </div>
  );
};
