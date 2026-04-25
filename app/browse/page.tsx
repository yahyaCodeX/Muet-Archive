"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  Search, Filter, FileText, Download, Star,
  CheckCircle, ChevronDown, Loader2, SlidersHorizontal, X
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const TYPE_TABS = ["All", "Past Paper", "Notes", "Handout"];

export default function BrowsePage() {
  const supabase = createClient();
  const [activeTab, setActiveTab]   = useState("All");
  const [resources, setResources]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters]       = useState({ department: "All", batch: "All", semester: "All" });
  const [departments, setDepartments] = useState<any[]>([]);
  const [batches, setBatches]       = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function loadFilters() {
      const [{ data: depts }, { data: bths }] = await Promise.all([
        supabase.from("departments").select("*"),
        supabase.from("batches").select("*"),
      ]);
      if (depts) setDepartments(depts);
      if (bths)  setBatches(bths);
    }
    loadFilters();
  }, [supabase]);

  useEffect(() => { fetchResources(); }, [activeTab, filters]);

  async function fetchResources() {
    setLoading(true);
    try {
      let query = supabase
        .from("resources")
        .select(`*, departments (code), batches (label), profiles (full_name)`)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (activeTab !== "All")       query = query.eq("type", activeTab.toLowerCase().replace(" ", "_"));
      if (filters.department !== "All") query = query.eq("department_id", filters.department);
      if (filters.batch !== "All")   query = query.eq("batch_id", filters.batch);
      if (filters.semester !== "All") query = query.eq("semester", filters.semester);

      const { data, error } = await query;
      if (error) throw error;
      if (data) setResources(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResources();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#07050f" }}>
      <Navbar />

      {/* ── Header ── */}
      <div className="relative overflow-hidden py-16 px-4"
        style={{
          background: "linear-gradient(180deg, #0d0a1a 0%, #07050f 100%)",
          borderBottom: "1px solid rgba(168,85,247,0.12)"
        }}
      >
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full bg-primary/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div
            className="glass-label inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-primary uppercase tracking-wider mb-5"
          >
            <Search className="w-3 h-3" />
            Library
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-text">
            Find Study <span className="text-gradient">Materials</span>
          </h1>
          <p className="text-text-muted mb-8">
            Browse thousands of past papers, notes &amp; handouts — curated for MUETians.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-text-subtle group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by subject, department, or keyword..."
              className="w-full pl-14 pr-36 py-4 rounded-2xl text-text placeholder-text-subtle outline-none transition-all text-sm font-medium"
              style={{
                background: "rgba(18,16,31,0.8)",
                border: "1px solid rgba(168,85,247,0.2)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 0 0 0 transparent",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(168,85,247,0.5)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(168,85,247,0.15)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(168,85,247,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
            />
            <button
              type="submit"
              className="absolute inset-y-2 right-2 px-6 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)" }}
            >
              Search
            </button>
          </form>

          {/* Type tabs */}
          <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? "text-white"
                    : "text-text-muted hover:text-text hover:bg-white/5"
                }`}
                style={activeTab === tab ? {
                  background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                  boxShadow: "0 0 16px rgba(168,85,247,0.35)",
                } : {}}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 container mx-auto px-4 py-10 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Mobile filter toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted border transition-all"
              style={{ borderColor: "rgba(168,85,247,0.2)", background: "rgba(18,16,31,0.6)" }}
            >
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              Filters
              {showFilters ? <X className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* ── Filters Sidebar ── */}
          <AnimatePresence>
            <motion.div
              initial={false}
              className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-60 flex-shrink-0`}
            >
                <div
                  className="rounded-2xl p-5 sticky top-24 border"
                  style={{
                    background: "rgba(18,16,31,0.8)",
                    borderColor: "rgba(168,85,247,0.15)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b" style={{ borderColor: "rgba(168,85,247,0.12)" }}>
                    <Filter className="w-4 h-4 text-primary" />
                    <span className="font-bold text-text text-sm uppercase tracking-wider">Filters</span>
                  </div>

                  <div className="space-y-5">
                    {/* Department */}
                    <div>
                      <label className="text-xs font-semibold tracking-widest text-text-subtle mb-2.5 block uppercase">
                        Department
                      </label>
                      <select
                        value={filters.department}
                        onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                        className="w-full rounded-xl py-2.5 px-3 text-sm focus:outline-none text-text font-medium"
                        style={{
                          background: "rgba(26,23,40,0.8)",
                          border: "1px solid rgba(168,85,247,0.15)",
                        }}
                      >
                        <option value="All">All Departments</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.code}</option>
                        ))}
                      </select>
                    </div>

                    {/* Batch */}
                    <div>
                      <label className="text-xs font-semibold tracking-widest text-text-subtle mb-2.5 block uppercase">
                        Batch
                      </label>
                      <select
                        value={filters.batch}
                        onChange={(e) => setFilters({ ...filters, batch: e.target.value })}
                        className="w-full rounded-xl py-2.5 px-3 text-sm focus:outline-none text-text font-medium"
                        style={{
                          background: "rgba(26,23,40,0.8)",
                          border: "1px solid rgba(168,85,247,0.15)",
                        }}
                      >
                        <option value="All">All Batches</option>
                        {batches.map((b) => (
                          <option key={b.id} value={b.id}>{b.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Semester */}
                    <div>
                      <label className="text-xs font-semibold tracking-widest text-text-subtle mb-2.5 block uppercase">
                        Semester
                      </label>
                      <select
                        value={filters.semester}
                        onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                        className="w-full rounded-xl py-2.5 px-3 text-sm focus:outline-none text-text font-medium"
                        style={{
                          background: "rgba(26,23,40,0.8)",
                          border: "1px solid rgba(168,85,247,0.15)",
                        }}
                      >
                        <option value="All">Any Semester</option>
                        {[1,2,3,4,5,6,7,8].map((s) => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Reset */}
                    {(filters.department !== "All" || filters.batch !== "All" || filters.semester !== "All") && (
                      <button
                        onClick={() => setFilters({ department: "All", batch: "All", semester: "All" })}
                        className="w-full py-2 rounded-xl text-xs font-semibold text-danger border border-danger/20 bg-danger/5 hover:bg-danger/10 transition-all"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>
            </motion.div>
          </AnimatePresence>

          {/* ── Results ── */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-semibold text-text-muted">
                <span className="text-text font-bold text-lg">{resources.length}</span> resources found
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-subtle">Sort by:</span>
                <select
                  className="rounded-lg py-1.5 px-3 text-xs focus:outline-none text-text font-medium cursor-pointer"
                  style={{ background: "rgba(26,23,40,0.8)", border: "1px solid rgba(168,85,247,0.15)" }}
                >
                  <option>Newest</option>
                  <option>Most Downloaded</option>
                </select>
              </div>
            </div>

            {/* Loading */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-28 text-text-muted">
                <div className="relative mb-6">
                  <div className="w-14 h-14 rounded-full border border-primary/20 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                  <div className="absolute inset-0 rounded-full border border-primary/10 animate-ping" />
                </div>
                <p className="font-medium text-sm">Loading resources...</p>
              </div>
            ) : resources.length === 0 ? (
              <div
                className="text-center py-20 rounded-2xl border"
                style={{ borderColor: "rgba(168,85,247,0.12)", background: "rgba(18,16,31,0.5)" }}
              >
                <FileText className="w-14 h-14 text-text-subtle/40 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-text mb-2">No resources found</h3>
                <p className="text-text-muted text-sm">Try adjusting your filters or search query.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {resources.map((resource, i) => (
                  <motion.div
                    key={resource.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.4 }}
                  >
                    <Link href={`/resource/${resource.id}`} className="block h-full">
                      <div
                        className="relative h-full rounded-2xl p-[1px] overflow-hidden group hover:-translate-y-1 transition-transform duration-300"
                        style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.2) 0%, transparent 50%, rgba(168,85,247,0.1) 100%)" }}
                      >
                        <div
                          className="relative h-full rounded-2xl p-5 flex flex-col transition-all duration-300"
                          style={{ background: "rgba(18,16,31,0.95)" }}
                        >
                          {/* Hover glow */}
                          <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                          {/* Header */}
                          <div className="flex items-start justify-between mb-4 relative z-10">
                            <div
                              className="p-2.5 rounded-xl group-hover:scale-110 transition-transform"
                              style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.2)" }}
                            >
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <span
                              className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                              style={{ background: "rgba(168,85,247,0.1)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.2)" }}
                            >
                              {resource.type.replace('_', ' ')}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="font-bold text-base mb-2 line-clamp-2 text-text group-hover:text-primary-light transition-colors relative z-10">
                            {resource.title}
                          </h3>

                          {/* Meta */}
                          <div className="text-xs text-text-muted space-y-1.5 mb-4 flex-1 relative z-10">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-primary/50" />
                              {resource.departments?.code} • {resource.batches?.label}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-primary/50" />
                              Semester {resource.semester} {resource.year ? `• ${resource.year}` : ''}
                            </div>
                          </div>

                          {/* Footer */}
                          <div
                            className="flex items-center justify-between pt-3.5 border-t mt-auto relative z-10"
                            style={{ borderColor: "rgba(168,85,247,0.1)" }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 text-xs text-warning font-bold">
                                <Star className="w-3.5 h-3.5 fill-warning" />
                                <span>0.0</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-text-muted font-medium">
                                <Download className="w-3.5 h-3.5" />
                                <span>{resource.download_count}</span>
                              </div>
                            </div>
                            <div title={resource.is_verified ? "Verified" : "Unverified"}>
                              <CheckCircle
                                className={`w-4 h-4 ${resource.is_verified ? 'text-success' : 'text-text-subtle/30'}`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Load More */}
            {!loading && resources.length > 0 && (
              <div className="mt-10 text-center">
                <button
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold text-text-muted transition-all hover:text-text border"
                  style={{ borderColor: "rgba(168,85,247,0.15)", background: "rgba(18,16,31,0.7)" }}
                >
                  Load More <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
