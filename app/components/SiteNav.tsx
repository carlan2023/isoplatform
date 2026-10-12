"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { SITE_NAME } from "@/lib/site";

const sans = { fontFamily: "system-ui, sans-serif" } as const;

/** Absolute `/#section` hrefs so every link works from any page. */
const NAV_BEFORE = [
  { label: "For Businesses", href: "/iso-certification-consulting" },
] as const;

const NAV_AFTER = [
  { label: "Why Us", href: "/#why" },
  { label: "Pricing", href: "/#pricing" },
] as const;

/** Training menu: Lead Auditor courses, then in-house internal audit training. */
const TRAINING_LINKS = [
  { label: "Lead Auditor courses", href: "/#courses" },
  { label: "Internal Audit Training", href: "/internal-audit-training" },
] as const;

const APPLY_HREF = "/apply";

function isCurrent(pathname: string, href: string) {
  return pathname === href;
}

/**
 * Shared sticky site navigation for the marketing pages. Desktop shows the full
 * link row; below `md` it collapses into an accessible hamburger menu.
 */
export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const [trainingOpen, setTrainingOpen] = useState(false);
  const menuId = useId();
  const trainingMenuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const onTrainingPage = pathname === "/internal-audit-training";

  // Close on route change (e.g. navigating to another page from the menu).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
    setTrainingOpen(pathname === "/internal-audit-training");
  }

  // Close on Escape and return focus to the toggle.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  const linkClass = (href: string) =>
    `hover:text-teal-600 transition-colors ${
      isCurrent(pathname, href) ? "text-teal-700 font-semibold" : ""
    }`;

  return (
    <nav
      aria-label="Main"
      className="border-b border-slate-200 bg-white sticky top-0 z-50"
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <Link href="/" aria-label={`${SITE_NAME} — home`} onClick={close}>
          <Image
            src="/nam-qms-logo.png"
            alt={SITE_NAME}
            width={1280}
            height={586}
            priority
            sizes="96px"
            className="h-12 w-auto"
          />
        </Link>

        {/* Desktop */}
        <div
          className="hidden md:flex items-center gap-7 text-sm text-slate-600"
          style={sans}
        >
          {NAV_BEFORE.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={linkClass(l.href)}
              aria-current={isCurrent(pathname, l.href) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
          <TrainingMenu pathname={pathname} menuId={trainingMenuId} />
          {NAV_AFTER.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={linkClass(l.href)}
              aria-current={isCurrent(pathname, l.href) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="hover:text-teal-600 transition-colors"
          >
            Student Portal
          </Link>
          <Link
            href={APPLY_HREF}
            className="inline-flex items-center gap-1.5 text-white px-4 py-2 rounded-md font-medium transition-colors hover:bg-teal-700"
            style={{ backgroundColor: "#0d9488" }}
          >
            Apply for certification <ArrowRight size={14} />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          ref={buttonRef}
          type="button"
          className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        id={menuId}
        hidden={!open}
        className="md:hidden border-t border-slate-200 bg-white"
        style={sans}
      >
        <ul className="max-w-6xl mx-auto px-6 py-4 space-y-1">
          {NAV_BEFORE.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={close}
                className="block py-3 text-slate-700 hover:text-teal-600"
                aria-current={isCurrent(pathname, l.href) ? "page" : undefined}
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              className={`flex w-full items-center justify-between py-3 hover:text-teal-600 ${
                onTrainingPage ? "text-teal-700 font-semibold" : "text-slate-700"
              }`}
              aria-expanded={trainingOpen}
              aria-controls={`${trainingMenuId}-mobile`}
              onClick={() => setTrainingOpen((o) => !o)}
            >
              Training
              <ChevronDown
                size={16}
                className={`transition-transform ${trainingOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            <ul id={`${trainingMenuId}-mobile`} hidden={!trainingOpen} className="pb-2">
              {TRAINING_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    className={`block py-2.5 pl-3 hover:text-teal-600 ${
                      isCurrent(pathname, item.href)
                        ? "text-teal-700 font-semibold"
                        : "text-slate-700"
                    }`}
                    aria-current={
                      isCurrent(pathname, item.href) ? "page" : undefined
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          {NAV_AFTER.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={close}
                className="block py-3 text-slate-700 hover:text-teal-600"
                aria-current={isCurrent(pathname, l.href) ? "page" : undefined}
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/login"
              onClick={close}
              className="block py-3 text-slate-700 hover:text-teal-600"
            >
              Student Portal
            </Link>
          </li>
          <li className="pt-2">
            <Link
              href={APPLY_HREF}
              onClick={close}
              className="flex items-center justify-center gap-2 text-white px-4 py-3 rounded-md font-medium"
              style={{ backgroundColor: "#0d9488" }}
            >
              Apply for certification <ArrowRight size={16} />
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

function TrainingMenu({
  pathname,
  menuId,
}: {
  pathname: string;
  menuId: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const onTrainingPage = pathname === "/internal-audit-training";

  // Close when the route changes, during render (same pattern as the mobile menu).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointer(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`inline-flex items-center gap-1 hover:text-teal-600 transition-colors ${
          onTrainingPage ? "text-teal-700 font-semibold" : ""
        }`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
      >
        Training
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {/* pt-2 is inside the popup so the pointer can cross the gap without
          closing the menu (the button's margin would sit outside the hit area). */}
      <div className="absolute left-0 top-full z-50 pt-2" hidden={!open}>
        <div
          id={menuId}
          role="menu"
          className="min-w-64 rounded-md border border-slate-200 bg-white py-2 shadow-lg"
        >
          {TRAINING_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              className={`block px-4 py-2.5 hover:bg-teal-50 hover:text-teal-700 ${
                isCurrent(pathname, item.href)
                  ? "text-teal-700 font-semibold"
                  : "text-slate-700"
              }`}
              aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
