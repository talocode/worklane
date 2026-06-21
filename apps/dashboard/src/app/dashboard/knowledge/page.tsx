'use client';

import { useEffect, useState } from 'react';

export default function KnowledgePage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('general');

  const load = () => fetch('/api/knowledge').then(r => r.json()).then(d => setDocs(d.knowledge || []));
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!title || !content) return;
    await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, tags: tags.split(',').map(s => s.trim()).filter(Boolean), category }),
    });
    setTitle(''); setContent(''); setTags('');
    load();
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 800 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>Knowledge Base</h1>
      <div style={{ padding: 20, background: '#16161e', border: '1px solid #2a2a3a', borderRadius: 8, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Add Document</h2>
        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} style={input} />
        <textarea placeholder="Content" value={content} onChange={e => setContent(e.target.value)} style={{ ...input, minHeight: 80 }} />
        <input placeholder="Tags (comma-separated)" value={tags} onChange={e => setTags(e.target.value)} style={input} />
        <select value={category} onChange={e => setCategory(e.target.value)} style={input}>
          <option value="general">General</option>
          <option value="guidelines">Guidelines</option>
          <option value="process">Process</option>
          <option value="brand">Brand</option>
        </select>
        <button onClick={add} style={btn}>Add Document</button>
      </div>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Documents ({docs.length})</h2>
      {docs.map(d => (
        <div key={d.id} style={listItem}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>{d.title}</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{d.content.slice(0, 120)}...</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Category: {d.category} · Tags: {d.tags.join(', ')}</div>
        </div>
      ))}
    </div>
  );
}

const input: React.CSSProperties = { display: 'block', width: '100%', padding: '8px 12px', marginBottom: 8, background: '#0a0a0f', border: '1px solid #2a2a3a', borderRadius: 6, color: '#e0e0e0', fontSize: 14, boxSizing: 'border-box' };
const btn: React.CSSProperties = { padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 };
const listItem: React.CSSProperties = { padding: '12px 16px', background: '#16161e', border: '1px solid #2a2a3a', borderRadius: 6, marginBottom: 8 };
