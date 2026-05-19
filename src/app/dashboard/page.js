'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [providers, setProviders] = useState([]);

  // Change your dashboard event listener setup to this:
useEffect(() => {
  // Initial database pull
  const fetchProviders = () => {
    fetch('/api/providers')
      .then((res) => res.json())
      .then((data) => setProviders(data))
      .catch((err) => console.error("Error fetching providers:", err));
  };

  fetchProviders();

  const eventSource = new EventSource('/api/sse');
  
  // Triggers smoothly whenever a lead is assigned or quota is reset
  eventSource.addEventListener('lead-assigned', () => {
    fetchProviders(); // Instantly pull fresh, accurate database lists
  });

  eventSource.addEventListener('quota-reset', () => {
    fetchProviders();
  });

  return () => {
    eventSource.close();
  };
}, []);

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-brand">⬡ Prowider</Link>
        <Link href="/request-service" className="nav-link">Request Service</Link>
        <Link href="/dashboard" className="nav-link active">Dashboard</Link>
        <Link href="/test-tools" className="nav-link">Test Tools</Link>
      </nav>
      
      <div className="page">
        <div className="page-title">Provider Dashboard</div>
        <p className="page-sub">Real-time status tracking for lead allocations and remaining quotas.</p>

        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          {providers.map((provider) => (
            <div key={provider.id} className="card" style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 700 }}>{provider.name}</h3>
              <p style={{ margin: '0 0 0.25rem 0' }}>Received Leads: <strong>{provider.leadsReceived}</strong></p>
              <p style={{ margin: '0 0 1rem 0', color: provider.monthlyQuota - provider.leadsReceived <= 2 ? 'red' : 'inherit' }}>
                Remaining Quota: <strong>{provider.monthlyQuota - provider.leadsReceived} / {provider.monthlyQuota}</strong>
              </p>
              
              <h4 style={{ fontSize: '0.85rem', margin: '0 0 0.5rem 0', textTransform: 'uppercase', color: '#64748b' }}>Assigned Lead IDs</h4>
              {provider.leadAssignments && provider.leadAssignments.length > 0 ? (
                <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.9rem' }}>
                  {provider.leadAssignments.map((assignment) => (
                    <li key={assignment.id} style={{ marginBottom: '0.25rem', fontFamily: 'monospace' }}>
                      {assignment.leadId}
                    </li>
                  ))}
                </ul>
              ) : (
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', italic: 'true' }}>No leads assigned yet</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}