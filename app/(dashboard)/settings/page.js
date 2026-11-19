'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Upload, ImageOff, Save } from 'lucide-react';
import { api, API_URL, auth } from '@/lib/api';
import PasswordInput from '@/components/PasswordInput';

const emptyService = () => ({ title: '', body: '' });
const emptyCaseType = () => ({ value: '', label: '' });

const assetUrl = (logoUrl) => {
  if (!logoUrl) return '';
  if (/^https?:\/\//i.test(logoUrl) || logoUrl.startsWith('data:')) return logoUrl;
  return `${API_URL}${logoUrl}`;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [firm, setFirm] = useState({
    firmName: '',
    shortName: '',
    license: '',
    phone: '',
    whatsapp: '',
    publicEmail: '',
    address: '',
    hours: '',
    logoUrl: '',
  });
  const [services, setServices] = useState([emptyService()]);
  const [caseTypes, setCaseTypes] = useState([emptyCaseType()]);

  const [account, setAccount] = useState({
    name: '',
    email: '',
    currentPasswordForEmail: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [settingsRes, meRes] = await Promise.all([
        api('/api/settings/admin'),
        api('/api/auth/me'),
      ]);
      const d = settingsRes.data;
      setFirm({
        firmName: d.firmName || '',
        shortName: d.shortName || '',
        license: d.license || '',
        phone: d.phone || '',
        whatsapp: d.whatsapp || '',
        publicEmail: d.publicEmail || '',
        address: d.address || '',
        hours: d.hours || '',
        logoUrl: d.logoUrl || '',
      });
      setServices(d.services?.length ? d.services.map((s) => ({ title: s.title, body: s.body })) : [emptyService()]);
      setCaseTypes(
        d.caseTypes?.length
          ? d.caseTypes.map((c) => ({ value: c.value, label: c.label }))
          : [emptyCaseType()]
      );
      setAccount({
        name: meRes.admin.name || '',
        email: meRes.admin.email || '',
        currentPasswordForEmail: '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setFirmField = (key) => (e) => setFirm((f) => ({ ...f, [key]: e.target.value }));

  const saveSite = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await api('/api/settings', {
        method: 'PUT',
        body: {
          ...firm,
          services: services.filter((s) => s.title.trim() && s.body.trim()),
          caseTypes: caseTypes
            .filter((c) => c.label.trim())
            .map((c) => ({
              label: c.label.trim(),
              value: c.value.trim() || undefined,
            })),
        },
      });
      setFirm((f) => ({ ...f, logoUrl: res.data.logoUrl || f.logoUrl }));
      setServices(res.data.services.map((s) => ({ title: s.title, body: s.body })));
      setCaseTypes(res.data.caseTypes.map((c) => ({ value: c.value, label: c.label })));
      setMessage(res.message || 'Settings saved');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const onLogoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    setMessage('');
    try {
      const form = new FormData();
      form.append('logo', file);
      const token = auth.getToken();
      const res = await fetch(`${API_URL}/api/settings/logo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setFirm((f) => ({ ...f, logoUrl: data.data.logoUrl }));
      setMessage(data.message || 'Logo updated');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async () => {
    setUploading(true);
    setError('');
    try {
      const res = await api('/api/settings/logo', { method: 'DELETE' });
      setFirm((f) => ({ ...f, logoUrl: '' }));
      setMessage(res.message || 'Logo removed');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const saveAccount = async (e) => {
    e.preventDefault();
    setSavingAccount(true);
    setError('');
    setMessage('');
    try {
      const body = {
        name: account.name,
        email: account.email,
      };
      if (account.currentPasswordForEmail) {
        body.currentPassword = account.currentPasswordForEmail;
      }
      const res = await api('/api/auth/profile', { method: 'PATCH', body });
      auth.save(res.token, res.admin);
      window.dispatchEvent(new CustomEvent('admin-updated', { detail: res.admin }));
      setAccount((a) => ({ ...a, name: res.admin.name, email: res.admin.email, currentPasswordForEmail: '' }));
      setMessage(res.message || 'Account updated');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingAccount(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    setError('');
    setMessage('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password and confirmation do not match');
      setSavingPassword(false);
      return;
    }
    try {
      const res = await api('/api/auth/password', {
        method: 'PATCH',
        body: {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
      });
      auth.save(res.token, res.admin);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage(res.message || 'Password updated');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <div className="skeleton skeleton--block" aria-busy="true" />;

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Settings</h1>
          <p className="muted">Firm details, logo, services, case types, and your admin login</p>
        </div>
      </header>

      {message && <p className="notice">{message}</p>}
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      <form className="settings" onSubmit={saveSite}>
        <section className="panel">
          <h2>Firm profile (landing page)</h2>
          <div className="form-grid">
            <label className="field">
              <span>Firm full name</span>
              <input required value={firm.firmName} onChange={setFirmField('firmName')} />
            </label>
            <label className="field">
              <span>Short name (header)</span>
              <input required value={firm.shortName} onChange={setFirmField('shortName')} />
            </label>
            <label className="field">
              <span>License number</span>
              <input value={firm.license} onChange={setFirmField('license')} />
            </label>
            <label className="field">
              <span>Public email</span>
              <input type="email" dir="ltr" value={firm.publicEmail} onChange={setFirmField('publicEmail')} />
            </label>
            <label className="field">
              <span>Phone</span>
              <input dir="ltr" required value={firm.phone} onChange={setFirmField('phone')} />
            </label>
            <label className="field">
              <span>WhatsApp (with country code)</span>
              <input dir="ltr" required value={firm.whatsapp} onChange={setFirmField('whatsapp')} placeholder="9665xxxxxxxx" />
            </label>
            <label className="field field--full">
              <span>Location / address</span>
              <input value={firm.address} onChange={setFirmField('address')} />
            </label>
            <label className="field field--full">
              <span>Working hours</span>
              <input value={firm.hours} onChange={setFirmField('hours')} />
            </label>
          </div>
        </section>

        <section className="panel">
          <h2>Logo</h2>
          <div className="logo-row">
            <div className="logo-preview">
              {firm.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={assetUrl(firm.logoUrl)} alt="Firm logo" />
              ) : (
                <span className="logo-empty">No logo uploaded</span>
              )}
            </div>
            <div className="logo-actions">
              <label className="btn btn--primary">
                <Upload size={16} /> {uploading ? 'Uploading…' : 'Upload logo'}
                <input type="file" accept="image/*" hidden disabled={uploading} onChange={onLogoChange} />
              </label>
              {firm.logoUrl && (
                <button type="button" className="btn btn--ghost" onClick={removeLogo} disabled={uploading}>
                  <ImageOff size={16} /> Remove
                </button>
              )}
              <p className="muted small">PNG, JPG, WEBP or SVG · max 2 MB. Shown in the landing page header and footer.</p>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2>Services</h2>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => setServices((s) => [...s, emptyService()])}
            >
              <Plus size={16} /> Add service
            </button>
          </div>
          <div className="stack">
            {services.map((s, i) => (
              <div key={i} className="stack-item">
                <div className="stack-item__head">
                  <strong>Service {i + 1}</strong>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Remove service"
                    disabled={services.length <= 1}
                    onClick={() => setServices((list) => list.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <label className="field">
                  <span>Title</span>
                  <input
                    value={s.title}
                    onChange={(e) =>
                      setServices((list) => list.map((row, idx) => (idx === i ? { ...row, title: e.target.value } : row)))
                    }
                  />
                </label>
                <label className="field">
                  <span>Description</span>
                  <textarea
                    rows={3}
                    value={s.body}
                    onChange={(e) =>
                      setServices((list) => list.map((row, idx) => (idx === i ? { ...row, body: e.target.value } : row)))
                    }
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2>Case types (form options)</h2>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => setCaseTypes((c) => [...c, emptyCaseType()])}
            >
              <Plus size={16} /> Add case type
            </button>
          </div>
          <div className="stack">
            {caseTypes.map((c, i) => (
              <div key={i} className="stack-item stack-item--row">
                <label className="field">
                  <span>Label shown on site</span>
                  <input
                    value={c.label}
                    onChange={(e) =>
                      setCaseTypes((list) =>
                        list.map((row, idx) => (idx === i ? { ...row, label: e.target.value } : row))
                      )
                    }
                  />
                </label>
                <label className="field">
                  <span>Value (optional slug)</span>
                  <input
                    dir="ltr"
                    placeholder="auto-generated if empty"
                    value={c.value}
                    onChange={(e) =>
                      setCaseTypes((list) =>
                        list.map((row, idx) => (idx === i ? { ...row, value: e.target.value } : row))
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Remove case type"
                  disabled={caseTypes.length <= 1}
                  onClick={() => setCaseTypes((list) => list.filter((_, idx) => idx !== i))}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? <Loader2 className="spin" size={16} /> : <Save size={16} />}
          Save site settings
        </button>
      </form>

      <div className="settings settings--account">
        <section className="panel">
          <h2>Admin account</h2>
          <form className="form-grid" onSubmit={saveAccount}>
            <label className="field">
              <span>Display name</span>
              <input required value={account.name} onChange={(e) => setAccount((a) => ({ ...a, name: e.target.value }))} />
            </label>
            <label className="field">
              <span>Login email</span>
              <input
                type="email"
                dir="ltr"
                required
                value={account.email}
                onChange={(e) => setAccount((a) => ({ ...a, email: e.target.value }))}
              />
            </label>
            <label className="field field--full">
              <span>Current password (required only when changing email)</span>
              <PasswordInput
                autoComplete="current-password"
                value={account.currentPasswordForEmail}
                onChange={(e) => setAccount((a) => ({ ...a, currentPasswordForEmail: e.target.value }))}
              />
            </label>
            <button type="submit" className="btn btn--primary" disabled={savingAccount}>
              {savingAccount && <Loader2 className="spin" size={16} />} Update account
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Change password</h2>
          <form className="form-grid" onSubmit={savePassword}>
            <label className="field field--full">
              <span>Current password</span>
              <PasswordInput
                required
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>New password</span>
              <PasswordInput
                required
                minLength={8}
                autoComplete="new-password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>Confirm new password</span>
              <PasswordInput
                required
                minLength={8}
                autoComplete="new-password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              />
            </label>
            <button type="submit" className="btn btn--primary" disabled={savingPassword}>
              {savingPassword && <Loader2 className="spin" size={16} />} Update password
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
