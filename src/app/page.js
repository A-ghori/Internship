'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function TestTools() {
  const [loading, setLoading] = useState({ quota: false, duplicateWebhook: false, concurrency: false });
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  // Feature 5 Requirement: Call webhook to reset quotas to 10
  const handleQuotaReset = async (isDuplicateCall = false) => {
    const key = isDuplicateCall ? "fixed-idempotency-key-12345" : `key-${Date.now()}`;
    const targetKey = isDuplicateCall ? "duplicateWebhook" : "quota";
    
    setLoading((prev) => ({ ...prev, [targetKey]: true }));
    addLog(`Calling Webhook /api/webhook with key: ${key}...`);

    try {
      const res = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: key,
          type: 'QUOTA_RESET',
        }),
      });
      const data = await res.json();
      
      if (data.idempotent) {
        addLog(`⚠️ IDEMPOTENCY SUCCESS: ${data.message}`);
      } else {
        addLog(`✓ SUCCESS: ${data.message || 'All provider quotas reset to 10.'}`);
      }
    } catch (err) {
      addLog(`✗ Error calling webhook: ${err.message}`);
    } finally {
      setLoading((prev) => ({ ...prev, [targetKey]: false }));
    }
  };

  // Feature 5 Requirement: Generate 10 leads instantly to test concurrency
  const handleGenerateConcurrencyLeads = async () => {
    setLoading((prev) => ({ ...prev, concurrency: true }));
    addLog('Firing 10 concurrent allocation requests instantly to test execution safety...');

    try {
      const res = await fetch('/api/test-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'GENERATE_CONCURRENCY_LEADS' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addLog('✓ Concurrency run complete! 10 simultaneous entries written. Check Dashboard.');
    } catch (err) {
      addLog(`✗ Concurrency generation failure: ${err.message}`);
    } finally {
      setLoading((prev) => ({ ...prev, concurrency: false }));
    }
  };

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-brand">⬡ Prowider</Link>
        <Link href="/request-service" className="nav-link">Request Service</Link>
        <Link href="/dashboard" className="nav-link">Dashboard</Link>
        <Link href="/test-tools" className="nav-link active">Test Tools</Link>
      </nav>

      <div className="page" style={{ maxWidth: 800 }}>
        <div className="page-title">Evaluation & Test Tools</div>
        <p className="page-sub">Verify the core backend integrity, transaction concurrency safety, and webhook idempotency rules.</p>

        <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
          
          {/* Action Control Panel Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div className="card" style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Idempotent Webhook Safety</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                Simulates payment webhooks. The second button tests security constraints by sending an identical transaction token twice.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button 
                  onClick={() => handleQuotaReset(false)} 
                  disabled={loading.quota} 
                  style={{ width: '100%', padding: '0.6rem', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
                >
                  {loading.quota ? 'Processing...' : 'Reset Provider Quota to 10'}
                </button>
                <button 
                  onClick={() => handleQuotaReset(true)} 
                  disabled={loading.duplicateWebhook} 
                  style={{ width: '100%', padding: '0.6rem', background: '#475569', color: '#fff', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
                >
                  {loading.duplicateWebhook ? 'Simulating...' : 'Test Webhook Twice (Idempotency Test)'}
                </button>
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Concurrency Stress Test</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                Fires 10 service entries into the backend over the same millisecond timestamp block. Tests database race constraints and tracking limits.
              </p>
              <button 
                onClick={handleGenerateConcurrencyLeads} 
                disabled={loading.concurrency} 
                style={{ width: '100%', padding: '0.6rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
              >
                {loading.concurrency ? 'Executing Parallel Threads...' : '⚡ Generate 10 Leads Instantly'}
              </button>
            </div>

          </div>

          {/* Test Activity Output Stream Logger */}
          <div className="card" style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Real-time Output Logs</h3>
            <div style={{ flexGrow: 1, minHeight: '250px', background: '#0f172a', color: '#38bdf8', fontFamily: 'monospace', padding: '0.75rem', borderRadius: '0.25rem', fontSize: '0.8rem', overflowY: 'auto', maxHeight: '350px' }}>
              {logs.length === 0 ? (
                <div style={{ color: '#64748b' }}>Waiting for action input executions...</div>
              ) : (
                logs.map((log, index) => <div key={index} style={{ marginBottom: '0.4rem', lineBreak: 'anywhere' }}>{log}</div>)
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}