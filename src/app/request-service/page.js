'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RequestService() {
  const [services, setServices] = useState([
    { id: 1, name: 'Service 1' },
  { id: 2, name: 'Service 2' },
  { id: 3, name: 'Service 3' }
]);
  const [form, setForm] = useState({ name: '', phone: '', city: '', serviceId: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(setServices).catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError(null);
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, serviceId: parseInt(form.serviceId) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setResult(data);
      setForm({ name: '', phone: '', city: '', serviceId: '', description: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-brand">⬡ Prowider</Link>
        <Link href="/request-service" className="nav-link active">Request Service</Link>
        <Link href="/dashboard" className="nav-link">Dashboard</Link>
        <Link href="/test-tools" className="nav-link">Test Tools</Link>
      </nav>
      <div className="page" style={{ maxWidth: 640 }}>
        <div className="page-title">Request a Service</div>
        <p className="page-sub">Fill in your details and we'll match you with the right providers.</p>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label>Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="field">
                <label>Phone Number</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="10-digit number"
                  maxLength={10}
                  required
                />
              </div>
              <div className="field">
                <label>City</label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Mumbai"
                  required
                />
              </div>
              <div className="field">
                <label>Service Type</label>
                <select name="serviceId" value={form.serviceId} onChange={handleChange} required>
                  <option value="">Select a service...</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="field full">
                <label>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe what you need..."
                  required
                />
              </div>
            </div>

            <div className="mt-2">
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <><span className="spinner" /> Submitting...</> : 'Submit Enquiry'}
              </button>
            </div>
          </form>

          {result && (
            <div className="alert alert-success">
              <div style={{ fontWeight: 700, marginBottom: 4 }}>✓ Lead submitted successfully!</div>
              <div>Lead ID: {result.lead.id}</div>
              <div>Assigned to: {result.assignedProviders?.join(', ')}</div>
            </div>
          )}
          {error && (
            <div className="alert alert-error">✗ {error}</div>
          )}
        </div>

        <div className="card mt-2">
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
            <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Rules</div>
            <div>• Same phone + same service = rejected (duplicate)</div>
            <div>• Same phone + different service = allowed</div>
            <div>• Each lead is assigned to exactly 3 providers</div>
          </div>
        </div>
      </div>
    </>
  );
}