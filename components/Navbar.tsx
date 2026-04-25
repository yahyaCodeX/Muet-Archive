"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        setIsAdmin(profile?.role === 'admin');
      }
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        setIsAdmin(profile?.role === 'admin');
      } else {
        setIsAdmin(false);
      }
    });

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    window.location.href = "/auth/login";
  };

  const navLinks = [
    { name: "Browse", href: "/browse" },
    { name: "AI Assistant", href: "/ai-assistant" },
    { name: "Upload", href: "/upload" },
  ];

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? "bg-[rgba(7,5,15,0.85)] backdrop-blur-xl border-b border-[rgba(168,85,247,0.15)] shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            {/* Professional archive logomark */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-xl bg-primary/25 blur-md group-hover:blur-lg transition-all duration-300" />
              <div
                className="relative w-9 h-9 rounded-xl flex items-center justify-center border border-primary/25 group-hover:border-primary/50 transition-colors"
                style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(124,58,237,0.25) 100%)" }}
              >
                {/* Custom archive/vault SVG mark */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="2" y="3" width="20" height="5" rx="1.5" fill="#a855f7" opacity="0.9"/>
                  <path d="M4 8v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M9 12h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-[15px] font-black tracking-tight text-text">
                MUET <span className="text-gradient">Archive</span>
              </span>
              <span className="text-[10px] font-medium text-text-subtle tracking-widest uppercase mt-0.5">Study Hub</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  pathname === link.href
                    ? "text-primary bg-primary/10"
                    : "text-text-muted hover:text-text hover:bg-white/5"
                }`}
              >
                {link.name}
                {pathname === link.href && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-primary to-primary-light"
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-text-muted hover:text-primary transition-colors px-3 py-2"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="text-sm font-medium text-text-muted hover:text-text transition-colors px-3 py-2"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="glass-button text-sm font-semibold px-5 py-2 rounded-xl bg-danger/10 text-danger hover:bg-danger/20 transition-all"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="glass-label text-sm font-medium text-text-muted hover:text-text transition-colors px-4 py-2 rounded-xl"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/register"
                  className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white overflow-hidden group"
                  style={{
                    background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                    boxShadow: "0 0 20px rgba(168,85,247,0.35)",
                  }}
                >
                  <span className="relative z-10">Sign up</span>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-text-muted hover:text-text transition-colors rounded-lg hover:bg-white/5"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Menu className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-[rgba(168,85,247,0.12)]"
            style={{ background: "rgba(7,5,15,0.95)", backdropFilter: "blur(20px)" }}
          >
            <div className="container mx-auto px-6 py-5 flex flex-col gap-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={link.href}
                    className={`block px-4 py-3 rounded-xl text-base font-medium transition-all ${
                      pathname === link.href
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-text-muted hover:text-text hover:bg-white/5"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <div className="border-t border-[rgba(168,85,247,0.12)] my-3 pt-4 flex flex-col gap-3">
                {user ? (
                  <>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="text-center py-2.5 px-4 rounded-xl text-primary font-semibold bg-primary/10 border border-primary/20"
                        onClick={() => setIsOpen(false)}
                      >
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      className="text-center py-2.5 px-4 rounded-xl text-text-muted font-medium hover:text-text hover:bg-white/5 transition-all"
                      onClick={() => setIsOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => { handleLogout(); setIsOpen(false); }}
                      className="py-3 px-4 rounded-xl bg-danger/10 text-danger font-semibold border border-danger/20 hover:bg-danger/20 transition-all"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="text-center py-2.5 px-4 rounded-xl text-text-muted font-medium hover:text-text hover:bg-white/5 transition-all"
                      onClick={() => setIsOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      href="/auth/register"
                      className="text-center py-3 px-4 rounded-xl text-white font-semibold"
                      style={{ background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)", boxShadow: "0 0 20px rgba(168,85,247,0.3)" }}
                      onClick={() => setIsOpen(false)}
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
