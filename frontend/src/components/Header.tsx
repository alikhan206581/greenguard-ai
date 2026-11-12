"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ShieldCheck,
  FileCheck,
  Sun,
  Scale,
  History,
  LayoutDashboard,
  ArrowUpRight,
  Cpu,
  Leaf,
  Menu,
  PanelLeftClose,
} from "lucide-react";

interface HeaderProps {
  activeTab?: "home" | "review" | "solar" | "fairness" | "history";
  onTabChange?: (
    tab: "review" | "solar" | "fairness" | "history"
  ) => void;
  llmProvider?: string;
  onLlmProviderChange?: (provider: string) => void;
  backendOnline?: boolean | null;
  historyCount?: number;
  busy?: boolean;
}

export function Header({
  activeTab = "home",
  onTabChange,
  llmProvider = "deterministic",
  onLlmProviderChange,
  backendOnline = null,
  historyCount = 0,
  busy = false,
}: HeaderProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("greenguard-sidebar-open");

      setSidebarOpen(
        saved === null
          ? !window.matchMedia("(max-width: 760px)").matches
          : saved === "true"
      );
    } catch {
      // Sidebar still works if browser storage is unavailable.
    }
  }, []);

  const changeSidebar = (open: boolean) => {
    setSidebarOpen(open);

    try {
      localStorage.setItem("greenguard-sidebar-open", String(open));
    } catch {
      // Saving this preference is optional.
    }

    if (!open) {
      menuButton.current?.focus();
    }
  };

  const items = [
    {
      href: "/",
      label: "Overview",
      icon: LayoutDashboard,
      active: pathname === "/" && activeTab !== "history",
    },
    {
      href: "/electricity-claim-check",
      label: "Electricity claims",
      icon: FileCheck,
      active: pathname === "/electricity-claim-check",
    },
    {
      href: "/solar-zero-bill-check",
      label: "Solar intelligence",
      icon: Sun,
      active: pathname === "/solar-zero-bill-check",
    },
    {
      href: "/fairness-and-robustness",
      label: "Fairness & robustness",
      icon: Scale,
      active: pathname === "/fairness-and-robustness",
    },
  ];

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to workspace
      </a>

      <aside
        id="gg-sidebar"
        className="gg-sidebar"
        hidden={!sidebarOpen}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            changeSidebar(false);
          }
        }}
      >
        <button
          type="button"
          className="gg-sidebar-close"
          aria-label="Close sidebar"
          aria-controls="gg-sidebar"
          aria-expanded={sidebarOpen}
          onClick={() => changeSidebar(false)}
        >
          <PanelLeftClose size={17} />
          <span>Close menu</span>
        </button>

        <Link href="/" className="gg-brand">
          <span className="gg-brand-mark">
            <ShieldCheck size={25} />
          </span>

          <span>
            GreenGuard
            <span className="gg-brand-ai">AI</span>
            <small>SUSTAINABILITY INTELLIGENCE</small>
          </span>
        </Link>

        <div className="gg-workspace-label">
          <span className="gg-workspace-avatar">G</span>

          <div>
            Green finance workspace
            <small>Evidence review platform</small>
          </div>
        </div>

        <p className="gg-nav-label">WORKSPACE</p>

        <nav aria-label="Main navigation" className="gg-nav">
          {items.map(({ href, label, icon: Icon, active }) => (
            <Link
              key={href}
              href={href}
              onClick={() => {
                if (href === "/") {
                  onTabChange?.("review");
                }
              }}
              className={active ? "active" : ""}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
              {active && <span className="gg-nav-dot" />}
            </Link>
          ))}

          {onTabChange ? (
            <button
              type="button"
              className={activeTab === "history" ? "active" : ""}
              aria-pressed={activeTab === "history"}
              onClick={() => onTabChange("history")}
            >
              <History size={19} />
              <span>Audit history</span>
              <span className="gg-nav-count">{historyCount}</span>
            </button>
          ) : (
            <Link href="/?tab=history">
              <History size={19} />
              <span>Audit history</span>
            </Link>
          )}
        </nav>

        <div className="gg-sidebar-bottom">
          <div className="gg-purpose">
            <Leaf size={22} />

            <strong>
              Better evidence.
              <br />
              Greener decisions.
            </strong>

            <p>Bring clarity to every sustainability claim.</p>

            <Link href="/electricity-claim-check">
              Start a review
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="gg-sidebar-foot">
            <ShieldCheck size={16} />
            Built for evidence-led review
          </div>
        </div>
      </aside>

      <header className="gg-topbar">
        <div className="gg-topbar-leading">
          <button
            ref={menuButton}
            type="button"
            className="gg-menu-toggle"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-controls="gg-sidebar"
            aria-expanded={sidebarOpen}
            onClick={() => changeSidebar(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <PanelLeftClose size={19} />
            ) : (
              <Menu size={19} />
            )}
          </button>

          <div className="gg-breadcrumb">
            Workspace <span>/</span>
            <strong>
              {activeTab === "history"
                ? "Audit history"
                : items.find((item) => item.active)?.label || "Overview"}
            </strong>
          </div>
        </div>

        <div className="gg-topbar-tools">
          <span
            className={`gg-status ${
              backendOnline === false ? "offline" : ""
            }`}
            role="status"
          >
            <i />
            {backendOnline === null
              ? "Connecting"
              : backendOnline
              ? "Backend connected"
              : "Backend offline"}
          </span>

          {onLlmProviderChange && (
            <label className="gg-engine">
              <Cpu size={16} />
              <span className="sr-only">Analysis engine</span>

              <select
                disabled={busy}
                value={llmProvider}
                onChange={(event) =>
                  onLlmProviderChange(event.target.value)
                }
              >
                <option value="deterministic">Deterministic RAG</option>
                <option value="ollama">Local Ollama</option>
                <option value="openai">Cloud OpenAI</option>
                <option value="auto">Auto fallback</option>
              </select>
            </label>
          )}

          <span className="gg-avatar" aria-label="GreenGuard workspace">
            GG
          </span>
        </div>
      </header>
    </>
  );
}