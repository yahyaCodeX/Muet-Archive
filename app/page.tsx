"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  BookOpen, Upload, Sparkles, BrainCircuit, GraduationCap,
  Search, ArrowRight, Zap, Shield, Users, ChevronRight
} from "lucide-react";
import Navbar from "@/components/Navbar";

/* ─── tiny helpers ─────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as any, delay },
});

const STATS = [
  { label: "Past Papers",  value: "5,000+", icon: BookOpen,      color: "#a855f7" },
  { label: "Study Notes",  value: "1,200+", icon: GraduationCap, color: "#c084fc" },
  { label: "Students",     value: "10k+",   icon: Users,         color: "#7c3aed" },
  { label: "Departments",  value: "15+",    icon: BrainCircuit,  color: "#a855f7" },
];

const FEATURES = [
  {
    title: "Past Papers",
    desc: "Organized by batch & department — find exactly what you need in seconds.",
    icon: BookOpen,
    badge: "Library",
  },
  {
    title: "Notes & Handouts",
    desc: "High-quality study materials uploaded by top-performing MUETians.",
    icon: GraduationCap,
    badge: "Materials",
  },
  {
    title: "AI Study Assistant",
    desc: "Claude-powered learning companion that answers any academic question.",
    icon: BrainCircuit,
    badge: "AI",
  },
  {
    title: "Easy Upload",
    desc: "Contribute your papers and notes in under 2 minutes. Earn badges.",
    icon: Upload,
    badge: "Contribute",
  },
  {
    title: "Smart Search",
    desc: "Filter by semester, department, batch, and resource type instantly.",
    icon: Search,
    badge: "Search",
  },
  {
    title: "Contributor Badges",
    desc: "Get recognized for your help. Top contributors earn exclusive badges.",
    icon: Sparkles,
    badge: "Rewards",
  },
];

export default function Home() {
  return (
    <>
      <Navbar />

      {/* ──────────────────── HERO ──────────────────── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden mesh-bg grid-overlay">

        {/* === Purple Glow Orbs (Optimized for Performance) === */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(168,85,247,0.15) 0%, transparent 70%)" }} />
        <div className="absolute top-[30%] left-[-5%] w-[300px] h-[300px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[10%] right-[-5%] w-[350px] h-[350px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)" }} />

        {/* === Floating Elements (Simplified for Mobile Speed) === */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
          <div className="absolute top-[18%] left-[8%] w-12 h-12 rounded-2xl border border-primary/20 bg-surface/40 backdrop-blur-sm flex items-center justify-center animate-pulse">
            <BookOpen className="w-5 h-5 text-primary/70" />
          </div>
          <div className="absolute top-[25%] right-[10%] w-14 h-14 rounded-2xl border border-accent/20 bg-surface/40 backdrop-blur-sm flex items-center justify-center animate-pulse" style={{ animationDelay: "1s" }}>
            <BrainCircuit className="w-6 h-6 text-accent/70" />
          </div>
          <div className="absolute bottom-[25%] left-[12%] w-10 h-10 rounded-xl border border-violet/20 bg-surface/40 backdrop-blur-sm flex items-center justify-center animate-pulse" style={{ animationDelay: "0.5s" }}>
            <Zap className="w-4 h-4 text-violet/70" />
          </div>
          <div className="absolute bottom-[30%] right-[8%] w-12 h-12 rounded-2xl border border-primary/20 bg-surface/40 backdrop-blur-sm flex items-center justify-center animate-pulse" style={{ animationDelay: "2s" }}>
            <Shield className="w-5 h-5 text-primary/70" />
          </div>
        </div>

        {/* === Hero Content === */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">

          {/* Badge */}
          <motion.div {...fadeUp(0)} className="flex justify-center mb-8">
            <div className="glass-label inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-accent/90">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Built for MUETians, by a MUETian
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...fadeUp(0.1)}
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black mb-4 md:mb-6 leading-[1.05] md:leading-[0.95] tracking-[-0.02em] md:tracking-[-0.03em]"
          >
            <span className="block text-text">Your Ultimate</span>
            <span className="block text-gradient mt-1">MUET Study</span>
            <span className="block text-text mt-1">Companion</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            {...fadeUp(0.2)}
            className="text-base sm:text-lg md:text-xl text-text-muted mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-2"
          >
            Access thousands of past papers, notes &amp; handouts — uploaded by
            your fellow students. Ace your exams with our intelligent AI assistant.
          </motion.p>

          {/* CTAs */}
          <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 w-full">
            <Link
              href="/browse"
              className="relative group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-white font-semibold text-base overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                boxShadow: "0 0 30px rgba(168,85,247,0.4), 0 4px 15px rgba(0,0,0,0.3)",
              }}
            >
              <Search className="w-4.5 h-4.5 relative z-10" />
              <span className="relative z-10">Browse Resources</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-0.5 transition-transform" />
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </Link>

            <Link
              href="/upload"
              className="shimmer-border group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-text font-semibold text-base bg-surface/60 backdrop-blur-sm border border-border hover:bg-surface/80 transition-all duration-300"
            >
              <Upload className="w-4.5 h-4.5 text-primary" />
              Upload &amp; Contribute
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>

          {/* Trusted by badge */}
          <motion.p {...fadeUp(0.45)} className="mt-8 text-sm text-text-subtle flex items-center justify-center gap-2">
            <span className="flex -space-x-1.5">
              {["#a855f7","#7c3aed","#c084fc"].map((c, i) => (
                <span key={i} className="w-6 h-6 rounded-full border-2 border-bg" style={{ background: c }} />
              ))}
            </span>
            Trusted by 10,000+ MUETians
          </motion.p>
        </div>

        {/* ── Stats Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="relative z-10 mt-12 md:mt-20 w-full max-w-4xl px-2 md:px-4 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3"
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.08 }}
              className="glass-label rounded-2xl p-5 text-center group hover:-translate-y-1 transition-all duration-300 cursor-default"
            >
              <div
                className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}25` }}
              >
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div className="stat-value text-2xl mb-0.5">{stat.value}</div>
              <div className="text-xs font-medium text-text-subtle uppercase tracking-widest">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ──────────────────── CONTRIBUTION BANNER ──────────────────── */}
      <section className="py-28 px-4 relative overflow-hidden"
        style={{ background: "linear-gradient(180deg, #07050f 0%, #0d0a1a 100%)" }}
      >
        {/* BG glow (Optimized) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(168,85,247,0.1) 0%, transparent 70%)" }} />

        <div className="max-w-4xl mx-auto relative z-10">
          <div
            className="rounded-3xl p-[1px] overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.4) 0%, rgba(168,85,247,0.0) 50%, rgba(168,85,247,0.4) 100%)" }}
          >
            <div className="rounded-3xl p-8 md:p-12 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(18,16,31,0.98) 0%, rgba(26,23,40,0.98) 100%)" }}
            >
              {/* Inner glow (Optimized) */}
              <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 70%)" }} />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                {/* Icon */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl" />
                  <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center border border-primary/30"
                    style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(124,58,237,0.1))" }}
                  >
                    <GraduationCap className="w-10 h-10 text-primary" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-wider mb-4">
                    <Sparkles className="w-3 h-3" />
                    Community
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black mb-3 text-text tracking-tight">
                    🎓 Be a MUETian Hero!
                  </h2>
                  <p className="text-text-muted mb-4 leading-relaxed">
                    Every paper you upload helps hundreds of your fellow students ace their exams.
                    Knowledge shared is knowledge multiplied. Upload your past papers, notes, and handouts today —
                    it takes less than 2 minutes and earns you a <span className="text-primary font-semibold">Contributor Badge</span>.
                  </p>
                  <p className="text-sm italic text-text-subtle mb-6 border-l-2 border-primary/50 pl-4">
                    &quot;The best engineers build on the shoulders of those before them.&quot;
                  </p>
                  <Link
                    href="/upload"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-light transition-colors group/link"
                  >
                    START CONTRIBUTING
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────── FEATURES ──────────────────── */}
      <section className="py-28 px-4 relative overflow-hidden"
        style={{ background: "linear-gradient(180deg, #0d0a1a 0%, #07050f 100%)" }}
      >
        {/* Decorative grid */}
        <div className="absolute inset-0 grid-overlay opacity-60 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-transparent to-primary/30 pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="glass-label inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-primary uppercase tracking-wider mb-5">
              <Zap className="w-3 h-3" />
              Features
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-text mb-4">
              Everything You Need<br className="hidden md:block" />
              <span className="text-gradient"> to Excel</span>
            </h2>
            <p className="text-text-muted max-w-xl mx-auto">
              Six powerful tools built specifically for MUET engineering students — all in one place.
            </p>
          </motion.div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group relative rounded-2xl p-[1px] overflow-hidden hover:-translate-y-1 transition-transform duration-300 cursor-default"
                style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(168,85,247,0.0) 50%, rgba(168,85,247,0.15) 100%)" }}
              >
                <div
                  className="relative h-full rounded-2xl p-6 overflow-hidden transition-all duration-300"
                  style={{ background: "linear-gradient(135deg, rgba(18,16,31,0.95) 0%, rgba(26,23,40,0.95) 100%)" }}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Top row */}
                  <div className="flex items-start justify-between mb-5 relative z-10">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                      style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.2)" }}
                    >
                      <feat.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-primary bg-primary/10 border border-primary/20">
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-text mb-2 relative z-10 group-hover:text-primary-light transition-colors duration-200">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed relative z-10">
                    {feat.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────── FINAL CTA ──────────────────── */}
      <section className="py-28 px-4 relative overflow-hidden"
        style={{ background: "#07050f" }}
      >
        {/* Center orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(168,85,247,0.15) 0%, transparent 70%)" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center relative z-10"
        >
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            <span className="text-text">Start your </span>
            <span className="text-gradient">MUET journey</span>
            <span className="text-text"> today.</span>
          </h2>
          <p className="text-text-muted text-lg mb-10 leading-relaxed">
            Join over 10,000 MUETians already using MUET Archive to study smarter,
            not harder.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 w-full">
            <Link
              href="/browse"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-white font-bold text-base"
              style={{
                background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                boxShadow: "0 0 40px rgba(168,85,247,0.4), 0 8px 20px rgba(0,0,0,0.4)",
              }}
            >
              <Search className="w-5 h-5" />
              Browse Resources
            </Link>
            <Link
              href="/auth/register"
              className="w-full sm:w-auto glass-button inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-text font-bold text-base bg-surface/50 border border-border hover:bg-surface/70 transition-all"
            >
              Create Account
              <ArrowRight className="w-5 h-5 text-primary" />
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}
