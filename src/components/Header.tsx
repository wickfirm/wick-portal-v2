// Add this import at the top
import { usePathname } from "next/navigation";

// Inside the component, add:
const pathname = usePathname();
const isPlatformAdmin = user?.role === "PLATFORM_ADMIN";
const isPlatformAdminRoute = pathname?.startsWith("/platform-admin");

// Replace the navigation links section with:
{!isPlatformAdmin ? (
  // Regular agency navigation
  <>
    <Link
      href="/dashboard"
      style={{
        color: pathname === "/dashboard" ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname === "/dashboard" ? 600 : 400,
        fontSize: 15,
      }}
    >
      Dashboard
    </Link>
    <Link
      href="/clients"
      style={{
        color: pathname?.startsWith("/clients") ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname?.startsWith("/clients") ? 600 : 400,
        fontSize: 15,
      }}
    >
      Clients
    </Link>
    <Link
      href="/projects"
      style={{
        color: pathname?.startsWith("/projects") ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname?.startsWith("/projects") ? 600 : 400,
        fontSize: 15,
      }}
    >
      Projects
    </Link>
    <Link
      href="/timesheet"
      style={{
        color: pathname === "/timesheet" ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname === "/timesheet" ? 600 : 400,
        fontSize: 15,
      }}
    >
      Timesheet
    </Link>
    <Link
      href="/team"
      style={{
        color: pathname === "/team" ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname === "/team" ? 600 : 400,
        fontSize: 15,
      }}
    >
      Team
    </Link>
    <Link
      href="/agencies"
      style={{
        color: pathname === "/agencies" ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname === "/agencies" ? 600 : 400,
        fontSize: 15,
      }}
    >
      Agencies
    </Link>
    <Link
      href="/analytics"
      style={{
        color: pathname === "/analytics" ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname === "/analytics" ? 600 : 400,
        fontSize: 15,
      }}
    >
      Analytics
    </Link>
    <Link
      href="/settings"
      style={{
        color: pathname === "/settings" ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname === "/settings" ? 600 : 400,
        fontSize: 15,
      }}
    >
      Settings
    </Link>
  </>
) : (
  // Platform Admin navigation
  <>
    <Link
      href="/platform-admin"
      style={{
        color: pathname === "/platform-admin" ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname === "/platform-admin" ? 600 : 400,
        fontSize: 15,
      }}
    >
      Dashboard
    </Link>
    <Link
      href="/platform-admin/agencies"
      style={{
        color: pathname === "/platform-admin/agencies" ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname === "/platform-admin/agencies" ? 600 : 400,
        fontSize: 15,
      }}
    >
      Agencies
    </Link>
    <Link
      href="/platform-admin/users"
      style={{
        color: pathname === "/platform-admin/users" ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname === "/platform-admin/users" ? 600 : 400,
        fontSize: 15,
      }}
    >
      Users
    </Link>
    <Link
      href="/platform-admin/analytics"
      style={{
        color: pathname === "/platform-admin/analytics" ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname === "/platform-admin/analytics" ? 600 : 400,
        fontSize: 15,
      }}
    >
      Analytics
    </Link>
    <Link
      href="/settings"
      style={{
        color: pathname === "/settings" ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname === "/settings" ? 600 : 400,
        fontSize: 15,
      }}
    >
      Settings
    </Link>
  </>
)}
```

---

## 📦 Summary of All Files:

### New Pages (7 files):
1. `src/app/platform-admin/page.tsx` - Dashboard
2. `src/app/platform-admin/agencies/page.tsx` - Agencies (already done ✅)
3. `src/app/platform-admin/users/page.tsx` - Users
4. `src/app/platform-admin/analytics/page.tsx` - Analytics

### New APIs (3 files):
5. `src/app/api/platform-admin/dashboard/route.ts`
6. `src/app/api/platform-admin/users/route.ts`
7. `src/app/api/platform-admin/analytics/route.ts`
8. `src/app/api/platform-admin/agencies/route.ts` (already done ✅)
9. `src/app/api/platform-admin/agencies/[id]/route.ts` (already done ✅)

### Updated Files (1 file):
10. `src/components/Header.tsx` - Dynamic navigation

---

## 🧪 Testing Guide:

### Test as Platform Admin (mb@omnixia.ai):
```
1. Login as mb@omnixia.ai / omnixia2024
2. Should see ONLY: Dashboard, Agencies, Users, Analytics, Settings
3. Navigate to /platform-admin → See overview
4. Navigate to /platform-admin/agencies → See tenant list
5. Navigate to /platform-admin/users → See all 14 users
6. Navigate to /platform-admin/analytics → See metrics
7. Try accessing /clients → Should redirect or show access denied
```

### Test as Agency Admin (mb@thewickfirm.com):
```
1. Logout, login as mb@thewickfirm.com
2. Should see: Dashboard, Clients, Projects, etc. (full menu)
3. Try accessing /platform-admin → Should redirect to /dashboard
4. Everything else works normally
