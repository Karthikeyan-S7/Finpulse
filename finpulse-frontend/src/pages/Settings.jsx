import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { analyticsApi } from '../api/analytics';
import { usersApi } from '../api/users';

// UI Components
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Icon } from '../components/ui/Icon';

const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'INR (₹ - Indian Rupee)' },
  { value: 'USD', label: 'USD ($ - US Dollar)' },
  { value: 'EUR', label: 'EUR (€ - Euro)' },
  { value: 'GBP', label: 'GBP (£ - British Pound)' },
];

const LOCALE_OPTIONS = [
  { value: 'en-IN', label: 'English (India) — 1,25,000.50' },
  { value: 'en-US', label: 'English (United States) — 125,000.50' },
  { value: 'en-GB', label: 'English (United Kingdom) — 125,000.50' },
  { value: 'de-DE', label: 'German (Germany) — 125.000,50' },
];

export function Settings() {
  useDocumentTitle('Settings & Preferences');
  const navigate = useNavigate();
  const { user, userId, updateProfile } = useAuth();
  const { currency, locale } = useCurrency();
  const { theme, setTheme, effectiveTheme } = useTheme();
  const toast = useToast();

  // Profile form state
  const [fullName, setFullName] = useState(user?.fullName || 'Aarav Sharma');
  const [email, setEmail] = useState(user?.email || 'aarav.sharma@example.in');
  const [profileSaving, setProfileSaving] = useState(false);

  // Preference form state
  const [prefCurrency, setPrefCurrency] = useState(currency || 'INR');
  const [prefLocale, setPrefLocale] = useState(locale || 'en-IN');
  const [prefSaving, setPrefSaving] = useState(false);

  // Sync state if user context updates from backend
  useEffect(() => {
    if (user) {
      if (user.fullName) setFullName(user.fullName);
      if (user.email) setEmail(user.email);
      if (user.currency) setPrefCurrency(user.currency);
      if (user.locale) setPrefLocale(user.locale);
    }
  }, [user]);

  // Live currency formatting preview calculation
  const livePreview = useMemo(() => {
    try {
      const sampleAmount = 125450.75;
      const fmt = new Intl.NumberFormat(prefLocale, {
        style: 'currency',
        currency: prefCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return fmt.format(sampleAmount);
    } catch {
      return `₹1,25,450.75`;
    }
  }, [prefCurrency, prefLocale]);

  // Live Service Health States
  const [coreOnline, setCoreOnline] = useState(null);
  const [analyticsOnline, setAnalyticsOnline] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const checkServicesHealth = async () => {
    setCheckingHealth(true);
    try {
      const [coreRes, analyticsRes] = await Promise.allSettled([
        usersApi.getById(userId || 1),
        analyticsApi.checkHealth(),
      ]);

      setCoreOnline(coreRes.status === 'fulfilled');
      setAnalyticsOnline(
        analyticsRes.status === 'fulfilled' &&
        analyticsRes.value &&
        (analyticsRes.value.status === 'UP' || analyticsRes.value.database === 'CONNECTED')
      );
    } catch {
      setCoreOnline(false);
      setAnalyticsOnline(false);
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkServicesHealth();
  }, [userId]);

  // Handle Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Valid email address is required');
      return;
    }

    setProfileSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        currency: prefCurrency,
        locale: prefLocale,
      });
      toast.success('User profile updated successfully!');
    } catch (err) {
      console.error('Failed to update user profile:', err);
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Save Preferences
  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setPrefSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        currency: prefCurrency,
        locale: prefLocale,
      });
      toast.success(`Display preferences updated! Switched to ${prefCurrency} (${prefLocale}).`);
    } catch (err) {
      console.error('Failed to update preferences:', err);
      toast.error(err.message || 'Failed to update preferences');
    } finally {
      setPrefSaving(false);
    }
  };

  // Quick download export for the last 6 months
  const handleQuickDownload = () => {
    const today = new Date();
    const to = today.toISOString().split('T')[0];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const from = sixMonthsAgo.toISOString().split('T')[0];

    const url = analyticsApi.getExportCsvUrl({ userId, from, to });
    toast.info('Downloading CSV transaction export...');
    window.location.href = url;
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Settings & Preferences"
        subtitle="Manage your profile, regional currency formats, theme mode, data exports, and inspect system architecture."
      />

      <div className="dashboard-grid">
        {/* Left Column: Profile & Regional Preferences */}
        <div className="col-6">
          {/* Profile Card */}
          <Card style={{ marginBottom: 'var(--space-6)' }}>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardSubtitle>Personal identification and contact details</CardSubtitle>
            </CardHeader>
            <form onSubmit={handleSaveProfile}>
              <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <Field label="Full Name" required>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                  />
                </Field>

                <Field label="Email Address" required>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. aarav.sharma@example.in"
                  />
                </Field>
              </CardBody>
              <CardFooter style={{ borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="primary" loading={profileSaving}>
                  Save Profile
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Regional & Currency Preferences Card */}
          <Card>
            <CardHeader>
              <CardTitle>Regional & Currency Preferences</CardTitle>
              <CardSubtitle>Display currency, number formatting rules, and live preview</CardSubtitle>
            </CardHeader>
            <form onSubmit={handleSavePreferences}>
              <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="grid-2">
                  <Field label="Display Currency" required>
                    <Select
                      value={prefCurrency}
                      onChange={(e) => setPrefCurrency(e.target.value)}
                      options={CURRENCY_OPTIONS}
                    />
                  </Field>

                  <Field label="Formatting Locale" required>
                    <Select
                      value={prefLocale}
                      onChange={(e) => setPrefLocale(e.target.value)}
                      options={LOCALE_OPTIONS}
                    />
                  </Field>
                </div>

                {/* Live Currency Formatting Preview Callout */}
                <div
                  style={{
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-active)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>
                      Live Number Formatting Preview
                    </span>
                    <strong style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                      Evaluated via native Intl.NumberFormat
                    </strong>
                  </div>
                  <div
                    className="font-tabular"
                    style={{
                      fontSize: 'var(--font-lg)',
                      fontWeight: 'var(--weight-semibold)',
                      color: 'var(--accent)',
                    }}
                  >
                    {livePreview}
                  </div>
                </div>
              </CardBody>
              <CardFooter style={{ borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="primary" loading={prefSaving}>
                  Save Regional Preferences
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Right Column: Theme, Data Export & Architecture Health */}
        <div className="col-6">
          {/* Theme & Appearance Card */}
          <Card style={{ marginBottom: 'var(--space-6)' }}>
            <CardHeader>
              <CardTitle>Appearance & Theme</CardTitle>
              <CardSubtitle>Select high-contrast visual display mode</CardSubtitle>
            </CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <SegmentedControl
                options={[
                  { value: 'system', label: 'System Auto' },
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                ]}
                value={theme}
                onChange={(val) => {
                  setTheme(val);
                  toast.info(`Theme switched to ${val} mode`);
                }}
              />
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Icon name="sparkles" size={14} style={{ color: 'var(--accent)' }} />
                <span>
                  Active effective mode: <strong style={{ color: 'var(--text-primary)' }}>{effectiveTheme}</strong>. Optimized for WCAG AA compliance with dark background <code style={{ fontSize: '11px' }}>#0F1318</code> and crisp typography.
                </span>
              </div>
            </CardBody>
          </Card>

          {/* Data Export & Management Card */}
          <Card style={{ marginBottom: 'var(--space-6)' }}>
            <CardHeader>
              <CardTitle>Data Management & Export</CardTitle>
              <CardSubtitle>Direct access to spreadsheet exports and transaction archives</CardSubtitle>
            </CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Export your entire transaction ledger, income records, and expense categories directly into a UTF-8 encoded CSV spreadsheet. Suitable for Microsoft Excel, Apple Numbers, and external financial audits.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <Button
                  variant="primary"
                  onClick={handleQuickDownload}
                >
                  <Icon name="download" size={16} />
                  Download 6-Month CSV
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/reports?section=data-export')}
                >
                  <Icon name="externalLink" size={16} />
                  Advanced Date Filters in Reports
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* About & Architecture Health Card */}
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div>
                  <CardTitle>About & Service Health</CardTitle>
                  <CardSubtitle>Microservice status and runtime architecture</CardSubtitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={checkServicesHealth}
                  loading={checkingHealth}
                  title="Re-check service health"
                >
                  <Icon name="refresh" size={14} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: 'var(--font-base)', color: 'var(--text-primary)' }}>
                    FinPulse Personal Finance
                  </strong>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                    Release v2.0.0 (Production Build)
                  </div>
                </div>
                <Badge variant="neutral">React 18 + Spring Boot 3</Badge>
              </div>

              <div
                style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface-active)',
                  fontSize: 'var(--font-xs)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                Dual microservice architecture with core service running on port 8081 (Spring Boot 3 + Spring Data JPA) and analytical reporting service running on port 8082 (pure JDBC).
              </div>

              {/* Service Health Live Badges */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: coreOnline ? 'var(--color-income)' : 'var(--color-expense)',
                      }}
                    />
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>
                      Core Transactional Service
                    </span>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>(Port 8081)</span>
                  </div>
                  <Badge variant={coreOnline ? 'success' : 'danger'}>
                    {coreOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: analyticsOnline ? 'var(--color-income)' : 'var(--color-expense)',
                      }}
                    />
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>
                      Analytics JDBC Service
                    </span>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>(Port 8082)</span>
                  </div>
                  <Badge variant={analyticsOnline ? 'success' : 'danger'}>
                    {analyticsOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Settings;
