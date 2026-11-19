'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Download, RefreshCw, ChevronLeft, ChevronRight, Phone, MessageCircle } from 'lucide-react';
import { api, toQuery } from '@/lib/api';
import {
  amountLabels,
  statusLabels,
  statusOrder,
  formatDate,
  whatsappUrl,
  labelForCaseType,
} from '@/lib/labels';
import StatusBadge from '@/components/StatusBadge';

const emptyFilters = { search: '', status: '', caseType: '', from: '', to: '' };

export default function LeadsPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [stats, setStats] = useState(null);
  const [caseTypes, setCaseTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [list, s, settings] = await Promise.all([
        api(`/api/leads${toQuery({ ...filters, page, limit: 20 })}`),
        api('/api/leads/stats'),
        api('/api/settings/admin'),
      ]);
      setLeads(list.data);
      setPagination(list.pagination);
      setStats(s.data);
      setCaseTypes(settings.data.caseTypes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => (f.search === searchInput ? f : { ...f, search: searchInput }));
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilter = (key) => (e) => {
    setFilters((f) => ({ ...f, [key]: e.target.value }));
    setPage(1);
  };

  const resetFilters = () => {
    setSearchInput('');
    setFilters(emptyFilters);
    setPage(1);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await api(`/api/leads/export${toQuery(filters)}`, { raw: true });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Consultation requests</h1>
          <p className="muted">All leads submitted from the landing page form</p>
        </div>
        <div className="page-head__actions">
          <button type="button" className="btn btn--ghost" onClick={load} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} aria-hidden="true" /> Refresh
          </button>
          <button type="button" className="btn btn--primary" onClick={exportCsv} disabled={exporting}>
            <Download size={16} aria-hidden="true" /> Export CSV
          </button>
        </div>
      </header>

      <section className="stats" aria-label="Summary">
        <div className="stat">
          <span>Total requests</span>
          <strong>{stats?.total ?? '—'}</strong>
        </div>
        <div className="stat">
          <span>Today</span>
          <strong>{stats?.today ?? '—'}</strong>
        </div>
        <div className="stat stat--accent">
          <span>New — awaiting contact</span>
          <strong>{stats?.byStatus?.new ?? 0}</strong>
        </div>
        <div className="stat">
          <span>In progress</span>
          <strong>{stats?.byStatus?.in_progress ?? 0}</strong>
        </div>
        <div className="stat">
          <span>Closed</span>
          <strong>{stats?.byStatus?.closed ?? 0}</strong>
        </div>
      </section>

      <section className="filters" aria-label="Filters">
        <label className="search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by name, phone, company, or city"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search"
          />
        </label>
        <select value={filters.status} onChange={setFilter('status')} aria-label="Status">
          <option value="">All statuses</option>
          {statusOrder.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
        <select value={filters.caseType} onChange={setFilter('caseType')} aria-label="Case type">
          <option value="">All case types</option>
          {caseTypes.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <label className="date">
          <span>From</span>
          <input type="date" value={filters.from} onChange={setFilter('from')} />
        </label>
        <label className="date">
          <span>To</span>
          <input type="date" value={filters.to} onChange={setFilter('to')} />
        </label>
        {hasFilters && (
          <button type="button" className="link-btn" onClick={resetFilters}>
            Clear filters
          </button>
        )}
      </section>

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Company / city</th>
              <th>Case type</th>
              <th>Amount</th>
              <th>Status</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              leads.length === 0 &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td colSpan={8}>
                    <span className="skeleton" />
                  </td>
                </tr>
              ))}

            {!loading && leads.length === 0 && (
              <tr>
                <td colSpan={8} className="empty">
                  {hasFilters
                    ? 'No requests match the current filters.'
                    : 'No requests yet. They will appear here as soon as the landing page form is submitted.'}
                </td>
              </tr>
            )}

            {leads.map((lead) => (
              <tr key={lead._id} className={lead.status === 'new' ? 'is-new' : ''}>
                <td className="nowrap num">{formatDate(lead.createdAt)}</td>
                <td>
                  <Link href={`/leads/${lead._id}`} className="row-link">
                    {lead.fullName}
                  </Link>
                </td>
                <td className="nowrap num" dir="ltr">
                  {lead.phone}
                </td>
                <td>
                  {lead.companyName || '—'}
                  {lead.city && <small className="cell-sub">{lead.city}</small>}
                </td>
                <td>{labelForCaseType(lead.caseType, caseTypes)}</td>
                <td className="nowrap">{amountLabels[lead.amountRange]}</td>
                <td>
                  <StatusBadge status={lead.status} />
                </td>
                <td className="nowrap">
                  <div className="actions">
                    <a
                      href={`tel:${lead.phone}`}
                      className="icon-btn"
                      title="Call"
                      aria-label={`Call ${lead.fullName}`}
                    >
                      <Phone size={16} />
                    </a>
                    <a
                      href={whatsappUrl(lead.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="icon-btn"
                      title="WhatsApp"
                      aria-label={`WhatsApp ${lead.fullName}`}
                    >
                      <MessageCircle size={16} />
                    </a>
                    <Link href={`/leads/${lead._id}`} className="btn btn--small">
                      Details
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav className="pager" aria-label="Pagination">
        <span className="muted">
          {pagination.total} request{pagination.total === 1 ? '' : 's'} · Page {page} of {pagination.pages}
        </span>
        <div>
          <button
            type="button"
            className="icon-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            aria-label="Previous"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="icon-btn"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Next"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </nav>
    </>
  );
}
