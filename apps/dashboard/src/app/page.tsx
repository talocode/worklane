export default function Home() {
  return (
    <main style={{ maxWidth: 800, margin: '80px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
        WorkLane
      </h1>
      <p style={{ fontSize: 18, color: '#888', marginBottom: 32 }}>
        Open-source command center for team agents, shared knowledge, tool connections, and recurring work.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <a href="/dashboard" style={cardStyle}>Dashboard →</a>
        <a href="/dashboard/agents" style={cardStyle}>Agents →</a>
        <a href="/dashboard/knowledge" style={cardStyle}>Knowledge →</a>
        <a href="/dashboard/connections" style={cardStyle}>Connections →</a>
        <a href="/dashboard/runs" style={cardStyle}>Task Runs →</a>
        <a href="/dashboard/tool-gateway" style={cardStyle}>Tool Gateway →</a>
        <a href="/dashboard/automation" style={cardStyle}>Loops & Routines →</a>
        <a href="/dashboard/execution" style={cardStyle}>Execution Queue →</a>
        <a href="/dashboard/audit" style={cardStyle}>Audit Log →</a>
      </div>
      <p style={{ marginTop: 40, fontSize: 12, color: '#555' }}>
        v0.1 · Local-first · Self-hostable · MIT License
      </p>
    </main>
  );
}

const cardStyle: React.CSSProperties = {
  display: 'block',
  padding: '20px 24px',
  background: '#16161e',
  border: '1px solid #2a2a3a',
  borderRadius: 8,
  color: '#e0e0e0',
  textDecoration: 'none',
  fontSize: 16,
};
