"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { SITE_NAME } from "@/lib/site";

const sans = { fontFamily: "system-ui, sans-serif" } as const;

/** Absolute `/#section` hrefs so every link works from any page. */
const NAV_LINKS = [
  { label: "For Businesses", href: "/iso-certification-consulting" },
  { label: "Training", href: "/#courses" },
  { label: "Why Us", href: "/#why" },
  { label: "Pricing", href: "/#pricing" },
] as const;

const APPLY_HREF = "/apply";

/**
 * Shared sticky site navigation for the marketing pages. Desktop shows the full
 * link row; below `md` it collapses into an accessible hamburger menu.
 */
export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Close on route change (e.g. navigating to another page from the menu).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
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
            height={646}
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
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`hover:text-teal-600 transition-colors ${
                pathname === l.href ? "text-teal-700 font-semibold" : ""
              }`}
              aria-current={pathname === l.href ? "page" : undefined}
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
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={close}
                className="block py-3 text-slate-700 hover:text-teal-600"
                aria-current={pathname === l.href ? "page" : undefined}
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
