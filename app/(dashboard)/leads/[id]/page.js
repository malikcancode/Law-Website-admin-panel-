'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Phone, MessageCircle, Mail, Trash2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import {
  amountLabels,
  contactLabels,
  statusLabels,
  statusOrder,
  formatDate,
  whatsappUrl,
  labelForCaseType,
} from '@/lib/labels';
import StatusBadge from '@/components/StatusBadge';

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lead, setLead] = useState(null);
  const [caseTypes, setCaseTypes] = useState([]);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api(`/api/leads/${id}`), api('/api/settings/admin')])
      .then(([leadRes, settingsRes]) => {
        setLead(leadRes.data);
        setCaseTypes(settingsRes.data.caseTypes || []);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  const update = async (body) => {
    setSaving(true);
    setError('');
    try {
      const r = await api(`/api/leads/${id}`, { method: 'PATCH', body });
      setLead(r.data);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    if (await update({ note })) setNote('');
  };

  const remove = async () => {
    if (!window.confirm('Delete this request permanently? This cannot be undone.')) return;
    try {
      await api(`/api/leads/${id}`, { method: 'DELETE' });
      router.replace('/');
    } catch (err) {
      setError(err.message);
    }
  };

  if (error && !lead) {
    return (
      <>
        <Link href="/" className="back">
          <ArrowLeft size={16} /> Back to requests
        </Link>
        <p className="alert">{error}</p>
      </>
    );
  }

  if (!lead) return <div className="skeleton skeleton--block" aria-busy="true" />;

  const rows = [
    ['Full name', lead.fullName],
    ['Mobile', <span dir="ltr" className="num">{lead.phone}</span>],
    ['Email', lead.email ? <span dir="ltr">{lead.email}</span> : '—'],
    ['Company / establishment', lead.companyName || '—'],
    ['City', lead.city || '—'],
    ['Case type', labelForCaseType(lead.caseType, caseTypes)],
    ['Approximate amount', amountLabels[lead.amountRange]],
    ['Preferred contact', contactLabels[lead.preferredContact]],
    ['Submitted', formatDate(lead.createdAt)],
    ['Last updated', formatDate(lead.updatedAt)],
  ];

  const sourceRows = [
    ['Page', lead.source?.page],
    ['Referrer', lead.source?.referrer],
    ['UTM Source', lead.source?.utmSource],
    ['UTM Medium', lead.source?.utmMedium],
    ['UTM Campaign', lead.source?.utmCampaign],
    ['IP address', lead.ip],
    ['Browser', lead.userAgent],
  ].filter(([, v]) => v);

  return (
    <>
      <Link href="/" className="back">
        <ArrowLeft size={16} /> Back to requests
      </Link>

      <header className="page-head">
        <div>
          <h1>{lead.fullName}</h1>
          <p className="muted">
            {labelForCaseType(lead.caseType, caseTypes)} · <StatusBadge status={lead.status} />
          </p>
        </div>
        <div className="page-head__actions">
          <a href={`tel:${lead.phone}`} className="btn btn--ghost">
            <Phone size={16} /> Call
          </a>
          <a href={whatsappUrl(lead.phone)} target="_blank" rel="noopener noreferrer" className="btn btn--ghost">
            <MessageCircle size={16} /> WhatsApp
          </a>
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="btn btn--ghost">
              <Mail size={16} /> Email
            </a>
          )}
        </div>
      </header>

      {error && <p className="alert">{error}</p>}

      <div className="detail">
        <div className="detail__main">
          <section className="panel">
            <h2>Request details</h2>
            <dl className="kv">
              {rows.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="panel">
            <h2>Case summary from the client</h2>
            <p className="message">{lead.message || 'The client did not add a summary.'}</p>
          </section>

          {sourceRows.length > 0 && (
            <section className="panel">
              <h2>Request source</h2>
              <dl className="kv kv--compact">
                {sourceRows.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd className="break" dir="ltr">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>

        <aside className="detail__side">
          <section className="panel">
            <h2>Status</h2>
            <div className="status-picker" role="radiogroup" aria-label="Request status">
              {statusOrder.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={lead.status === s}
                  className={`status-picker__opt ${lead.status === s ? 'is-active' : ''}`}
                  disabled={saving}
                  onClick={() => lead.status !== s && update({ status: s })}
                >
                  <span className={`dot dot--${s}`} aria-hidden="true" />
                  {statusLabels[s]}
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>Internal notes</h2>
            <form onSubmit={addNote} className="note-form">
              <textarea
                rows={3}
                placeholder="e.g. Called the client and asked them to send documents on WhatsApp"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                aria-label="New note"
              />
              <button className="btn btn--primary btn--block" disabled={saving || !note.trim()}>
                {saving && <Loader2 size={16} className="spin" />} Add note
              </button>
            </form>
            {lead.notes?.length ? (
              <ul className="notes">
                {[...lead.notes].reverse().map((n) => (
                  <li key={n._id}>
                    <p>{n.text}</p>
                    <small>
                      {n.author} · {formatDate(n.createdAt)}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted small">No notes yet.</p>
            )}
          </section>

          <button type="button" className="btn btn--danger btn--block" onClick={remove}>
            <Trash2 size={16} /> Delete request
          </button>
        </aside>
      </div>
    </>
  );
}
