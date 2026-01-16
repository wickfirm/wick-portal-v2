// /src/app/lead-qualifier/settings/page.tsx
// AI Lead Qualifier Configuration Page

'use client';

import { useState, useEffect } from 'react';
import { theme } from '@/lib/theme';

interface AIConfig {
  id?: string;
  services: string[];
  targetIndustries: string[];
  minBudget: number;
  targetCompanySize: string;
  budgetWeight: number;
  authorityWeight: number;
  needWeight: number;
  timelineWeight: number;
  qualificationThreshold: number;
  tone: string;
  greetingMessage: string;
  caseStudies: Array<{ client: string; result: string }>;
}

const SERVICE_OPTIONS = [
  'SEO',
  'AEO',
  'WEB_DEVELOPMENT',
  'PAID_MEDIA',
  'SOCIAL_MEDIA',
  'CONTENT',
  'BRANDING',
  'CONSULTING',
];

export default function AISettingsPage() {
  const [config, setConfig] = useState<AIConfig>({
    services: [],
    targetIndustries: [],
    minBudget: 5000,
    targetCompanySize: 'SMB',
    budgetWeight: 30,
    authorityWeight: 25,
    needWeight: 25,
    timelineWeight: 20,
    qualificationThreshold: 70,
    tone: 'consultative',
    greetingMessage: 'Hi! I\'m here to help you learn more about our services. What brings you here today?',
    caseStudies: [],
  });

  const [saving, setSaving] = useState(false);
  const [newIndustry, setNewIndustry] = useState('');
  const [newCaseStudy, setNewCaseStudy] = useState({ client: '', result: '' });

  useEffect(() => {
    // Load existing config
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const res = await fetch('/api/ai-config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig(data.config);
        }
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  async function saveConfig() {
    setSaving(true);
    try {
      const res = await fetch('/api/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        alert('Configuration saved successfully!');
      } else {
        alert('Failed to save configuration');
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  }

  function toggleService(service: string) {
    setConfig(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  }

  function addIndustry() {
    if (newIndustry.trim()) {
      setConfig(prev => ({
        ...prev,
        targetIndustries: [...prev.targetIndustries, newIndustry.trim()]
      }));
      setNewIndustry('');
    }
  }

  function removeIndustry(index: number) {
    setConfig(prev => ({
      ...prev,
      targetIndustries: prev.targetIndustries.filter((_, i) => i !== index)
    }));
  }

  function addCaseStudy() {
    if (newCaseStudy.client && newCaseStudy.result) {
      setConfig(prev => ({
        ...prev,
        caseStudies: [...prev.caseStudies, newCaseStudy]
      }));
      setNewCaseStudy({ client: '', result: '' });
    }
  }

  function removeCaseStudy(index: number) {
    setConfig(prev => ({
      ...prev,
      caseStudies: prev.caseStudies.filter((_, i) => i !== index)
    }));
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '600',
          color: theme.colors.textPrimary,
          marginBottom: '0.5rem'
        }}>
          AI Lead Qualifier Configuration
        </h1>
        <p style={{ color: theme.colors.textSecondary }}>
          Configure how the AI qualifies leads for your agency
        </p>
      </div>

      {/* Services Section */}
      <section style={{
        background: theme.colors.bgSecondary,
        padding: '1.5rem',
        borderRadius: theme.borderRadius.lg,
        marginBottom: '1.5rem',
        border: `1px solid ${theme.colors.borderLight}`
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: theme.colors.textPrimary,
          marginBottom: '1rem'
        }}>
          Services Offered
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {SERVICE_OPTIONS.map(service => (
            <label
              key={service}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                border: `2px solid ${config.services.includes(service) ? theme.colors.primary : theme.colors.borderLight}`,
                borderRadius: theme.borderRadius.md,
                background: config.services.includes(service) ? theme.colors.primaryBg : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <input
                type="checkbox"
                checked={config.services.includes(service)}
                onChange={() => toggleService(service)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                {service.replace(/_/g, ' ')}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Target Industries */}
      <section style={{
        background: theme.colors.bgSecondary,
        padding: '1.5rem',
        borderRadius: theme.borderRadius.lg,
        marginBottom: '1.5rem',
        border: `1px solid ${theme.colors.borderLight}`
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: theme.colors.textPrimary,
          marginBottom: '1rem'
        }}>
          Target Industries
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {config.targetIndustries.map((industry, i) => (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                background: theme.colors.infoBg,
                color: theme.colors.info,
                borderRadius: theme.borderRadius.md,
                fontSize: '0.875rem'
              }}
            >
              {industry}
              <button
                onClick={() => removeIndustry(i)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme.colors.info,
                  cursor: 'pointer',
                  padding: '0',
                  fontSize: '1.25rem',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={newIndustry}
            onChange={(e) => setNewIndustry(e.target.value)}
            placeholder="Add industry..."
            onKeyPress={(e) => e.key === 'Enter' && addIndustry()}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: theme.borderRadius.md,
              fontSize: '0.875rem'
            }}
          />
          <button
            onClick={addIndustry}
            style={{
              padding: '0.75rem 1.5rem',
              background: theme.colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Add
          </button>
        </div>
      </section>

      {/* Budget & Company Size */}
      <section style={{
        background: theme.colors.bgSecondary,
        padding: '1.5rem',
        borderRadius: theme.borderRadius.lg,
        marginBottom: '1.5rem',
        border: `1px solid ${theme.colors.borderLight}`
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: theme.colors.textPrimary,
          marginBottom: '1rem'
        }}>
          Qualification Criteria
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Minimum Budget ($/month)
            </label>
            <input
              type="number"
              value={config.minBudget}
              onChange={(e) => setConfig(prev => ({ ...prev, minBudget: parseInt(e.target.value) || 0 }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: theme.borderRadius.md,
                fontSize: '0.875rem'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Target Company Size
            </label>
            <select
              value={config.targetCompanySize}
              onChange={(e) => setConfig(prev => ({ ...prev, targetCompanySize: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: theme.borderRadius.md,
                fontSize: '0.875rem'
              }}
            >
              <option value="SMB">Small Business (1-50 employees)</option>
              <option value="MID_MARKET">Mid-Market (51-500 employees)</option>
              <option value="ENTERPRISE">Enterprise (500+ employees)</option>
            </select>
          </div>
        </div>
      </section>

      {/* BANT Weights */}
      <section style={{
        background: theme.colors.bgSecondary,
        padding: '1.5rem',
        borderRadius: theme.borderRadius.lg,
        marginBottom: '1.5rem',
        border: `1px solid ${theme.colors.borderLight}`
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: theme.colors.textPrimary,
          marginBottom: '1rem'
        }}>
          BANT Scoring Weights
        </h2>
        <p style={{ color: theme.colors.textSecondary, fontSize: '0.875rem', marginBottom: '1rem' }}>
          Total should equal 100 points
        </p>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {[
            { key: 'budgetWeight', label: 'Budget' },
            { key: 'authorityWeight', label: 'Authority' },
            { key: 'needWeight', label: 'Need' },
            { key: 'timelineWeight', label: 'Timeline' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                {label}: {config[key as keyof AIConfig]} points
              </label>
              <input
                type="range"
                min="0"
                max="40"
                value={config[key as keyof AIConfig] as number}
                onChange={(e) => setConfig(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: theme.colors.infoBg, borderRadius: theme.borderRadius.md }}>
          <strong>Total: {config.budgetWeight + config.authorityWeight + config.needWeight + config.timelineWeight} points</strong>
        </div>
      </section>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <button
          onClick={() => fetchConfig()}
          style={{
            padding: '0.75rem 1.5rem',
            background: theme.colors.bgTertiary,
            color: theme.colors.textPrimary,
            border: 'none',
            borderRadius: theme.borderRadius.md,
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Cancel
        </button>
        <button
          onClick={saveConfig}
          disabled={saving}
          style={{
            padding: '0.75rem 2rem',
            background: saving ? theme.colors.textMuted : theme.colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: theme.borderRadius.md,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            boxShadow: theme.shadows.button
          }}
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
