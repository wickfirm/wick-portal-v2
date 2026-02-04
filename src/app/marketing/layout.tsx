import type { Metadata } from "next";
import "./marketing.css";

export const metadata: Metadata = {
  title: "Omnixia - The All-in-One Agency Operating System",
  description: "Stop juggling 10+ tools. Omnixia unifies your CRM, projects, time tracking, invoicing, and team management in one beautiful platform built for modern agencies.",
  keywords: ["agency management", "CRM", "project management", "time tracking", "invoicing", "SaaS"],
  openGraph: {
    title: "Omnixia - The All-in-One Agency Operating System",
    description: "Stop juggling 10+ tools. Omnixia unifies your CRM, projects, time tracking, invoicing, and team management in one beautiful platform.",
    type: "website",
    url: "https://omnixia.ai",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marketing-root">
      {children}
    </div>
  );
}
