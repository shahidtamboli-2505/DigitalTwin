import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Map, Building2, Radio, Brain, Bell, FileText,
  Shield, ChevronLeft, ChevronRight, Menu, X, Sun, Moon,
  Search, BellRing, Cpu
} from "lucide-react";
import { ALERTS } from "../data/sangli-district";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/map", icon: Map, label: "GIS Map" },
  { to: "/infrastructure", icon: Building2, label: "Infrastructure" },
  { to: "/sensors", icon: Radio, label: "Live Sensors" },
  { to: "/ai-predictions", icon: Brain, label: "AI Predictions" },
  { to: "/ai-modeler", icon: Cpu, label: "AI 3D Agent" },
  { to: "/alerts", icon: Bell, label: "Alerts" },
  { to: "/reports", icon: FileText, label: "Reports" },
];

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const location = useLocation();

  const activeAlerts = ALERTS.filter(a => a.status === "active").length;

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  if (isDark && !document.documentElement.classList.contains("dark")) {
    document.documentElement.classList.add("dark");
  }

  const currentPage = NAV_ITEMS.find(item => item.to === location.pathname)?.label || "Dashboard";

  return (
    <div className="dt-layout">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="dt-mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`dt-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="dt-sidebar-header">
          <div className="dt-logo">
            <Shield className="dt-logo-icon" />
            {!collapsed && <span className="dt-logo-text">Digital Twin</span>}
          </div>
          <button
            className="dt-sidebar-toggle desktop-only"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button
            className="dt-sidebar-toggle mobile-only"
            onClick={() => setMobileOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        {!collapsed && (
          <div className="dt-sidebar-district">
            <span className="dt-district-badge">Sangli District</span>
            <span className="dt-district-sub">Maharashtra, India</span>
          </div>
        )}

        <nav className="dt-sidebar-nav">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => `dt-nav-item ${isActive ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? label : undefined}
            >
              <Icon size={20} />
              {!collapsed && <span>{label}</span>}
              {label === "Alerts" && activeAlerts > 0 && (
                <span className="dt-nav-badge">{activeAlerts}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {!collapsed && (
          <div className="dt-sidebar-footer">
            <div className="dt-system-status">
              <span className="dt-status-dot online" />
              <span>System Online</span>
            </div>
            <span className="dt-version">v2.0.0</span>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className={`dt-main ${collapsed ? "sidebar-collapsed" : ""}`}>
        {/* Top Bar */}
        <header className="dt-topbar">
          <div className="dt-topbar-left">
            <button className="dt-menu-btn mobile-only" onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="dt-breadcrumb">
              <span className="dt-breadcrumb-root">Digital Twin</span>
              <span className="dt-breadcrumb-sep">/</span>
              <span className="dt-breadcrumb-page">{currentPage}</span>
            </div>
          </div>

          <div className="dt-topbar-right">
            <div className="dt-search">
              <Search size={16} />
              <input type="text" placeholder="Search infrastructure, alerts..." />
            </div>
            <button className="dt-topbar-btn" onClick={toggleTheme} title="Toggle theme">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="dt-topbar-btn dt-notif-btn" title="Notifications">
              <BellRing size={18} />
              {activeAlerts > 0 && <span className="dt-notif-count">{activeAlerts}</span>}
            </button>
            <div className="dt-avatar" title="Admin">
              <span>AD</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="dt-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
