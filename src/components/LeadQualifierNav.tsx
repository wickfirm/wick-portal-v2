// /src/components/LeadQualifierNav.tsx
// Consistent navigation for Lead Qualifier section

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { theme } from '@/lib/theme';

interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

const mainNavItems: NavItem[] = [
  { label: 'Overview', href: '/lead-qualifier', icon: '📊' },
  { label: 'Conversations', href: '/lead-qualifier/conversations', icon: '💬' },
  { label: 'Qualified Leads', href: '/lead-qualifier/leads', icon: '👥' },
  { label: 'Analytics', href: '/lead-qualifier/analytics', icon: '📈' },
  { label: 'Settings', href: '/lead-qualifier/settings', icon: '⚙️' },
];

export function LeadQualifierNav() {
  const pathname = usePathname();

  return (
    <div style={{
      background: theme.colors.bgSecondary,
      borderBottom: `1px solid ${theme.colors.borderLight}`,
      marginBottom: '2rem',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 2rem',
      }}>
        <nav style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
        }}>
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || 
                           (item.href !== '/lead-qualifier' && pathname?.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: '1rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                  color: isActive ? theme.colors.primary : theme.colors.textSecondary,
                  borderBottom: `2px solid ${isActive ? theme.colors.primary : 'transparent'}`,
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.875rem',
      color: theme.colors.textSecondary,
      marginBottom: '1rem',
    }}>
      {items.map((item, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {index > 0 && <span style={{ opacity: 0.5 }}>›</span>}
          {item.href ? (
            <Link
              href={item.href}
              style={{
                color: theme.colors.textSecondary,
                textDecoration: 'none',
              }}
            >
              {item.label}
            </Link>
          ) : (
            <span style={{ color: theme.colors.textPrimary, fontWeight: '500' }}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
