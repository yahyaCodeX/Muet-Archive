"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  Search, Filter, FileText, Download, Star,
  CheckCircle, ChevronDown, Loader2, SlidersHorizontal, X, UploadCloud, Flame, PlusCircle
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { curriculumData } from "@/utils/curriculumData";
import { useRouter } from "next/navigation";

export default function BrowsePage() {
  const supabase = createClient();
  const router = useRouter();
  const [resources, setResources] = useState<any[]>([]);
  const [topResources, setTopResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dbSubjects, setDbSubjects] = useState<any[]>([]);
  
  const [filters, setFilters] = useState({ 
    department: "", 
    departmentCode: "",
    batch: "", 
    batchYear: 0,
    semester: "",
    subject: "",
    examType: "All",
    year: "All"
  });

  const [departments, setDepartments] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Derived subjects: Merge curriculum seed with any custom subjects from DB
  const semesterSubjects = Array.from(new Set([
    ...((curriculumData as any)[filters.departmentCode]?.[filters.semester] || []),
    ...dbSubjects.map(s => s.name)
  ]));

  useEffect(() => {
    async function loadInitialData() {
      const [{ data: depts }, { data: bths }, { data: top }] = await Promise.all([
        supabase.from("departments").select("*"),
        supabase.from("batches").select("*"),
        supabase.from("resources")
          .select(`*, departments(code), batches(label), resource_subjects(subjects(name))`)
          .eq("is_approved", true)
          .order("download_count", { ascending: false })
          .limit(6)
      ]);
      if (depts) setDepartments(depts);
      if (bths)  setBatches(bths);
      if (top) setTopResources(top);
    }
    loadInitialData();
  }, [supabase]);

  useEffect(() => { 
    if (filters.department && filters.semester) {
      fetchDbSubjects();
    }
    fetchResources(); 
  }, [filters]);

  async function fetchDbSubjects() {
    const { data } = await supabase
      .from("subjects")
      .select("name")
      .eq("department_id", filters.department)
      .eq("semester", parseInt(filters.semester))
      .eq("is_approved", true);
    if (data) setDbSubjects(data);
  }

  async function fetchResources() {
    setLoading(true);
    try {
      let query = supabase
        .from("resources")
        .select(`
          *,
          departments (code),
          batches (label),
          profiles (full_name),
          resource_subjects ( subjects (name) )
        `)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (filters.department) query = query.eq("department_id", filters.department);
      if (filters.batch) query = query.eq("batch_id", filters.batch);
      if (filters.semester) query = query.eq("semester", parseInt(filters.semester));
      if (filters.examType !== "All") query = query.eq("exam_type", filters.examType);
      if (filters.year !== "All") query = query.eq("year", parseInt(filters.year));
      
      if (searchQuery.trim() !== "") {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      query = query.limit(100);

      const { data, error } = await query;
      if (error) throw error;
      
      // Filter by subject manually if needed (since it's a junction table)
      let filteredData = data || [];
      if (filters.subject) {
        filteredData = filteredData.filter((r: any) => {
          if (r.is_old_batch) return r.old_batch_subject_name?.toLowerCase().includes(filters.subject.toLowerCase());
          return r.resource_subjects?.some((rs: any) => rs.subjects?.name === filters.subject);
        });
      }
      
      setResources(filteredData);
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

  const showGrid = filters.department && filters.batch && filters.semester && filters.batchYear >= 2022 && !searchQuery;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Header */}
      <div className="relative overflow-hidden pt-12 pb-6 px-4 border-b border-border bg-surface/30">
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight text-text">
            Resource <span className="text-gradient">Library</span>
          </h1>
          
          <form onSubmit={handleSearch} className="relative group max-w-2xl mx-auto mb-6">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-text-subtle group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, subject name..."
              className="w-full pl-14 pr-32 py-4 rounded-2xl bg-surface border border-border focus:border-primary/50 outline-none transition-all text-sm font-medium shadow-sm"
            />
            <button
              type="submit"
              className="absolute inset-y-2 right-2 px-6 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold transition-all"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Sticky Top Filter Bar */}
        <div className="sticky top-20 z-40 bg-background/80 backdrop-blur-xl border border-border rounded-2xl p-4 mb-8 shadow-sm">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex items-center gap-2 text-primary font-bold pr-2 border-r border-border min-w-max">
              <Filter className="w-4 h-4" /> Filters
            </div>
            
            {/* Department */}
            <select
              value={filters.department}
              onChange={(e) => {
                const code = departments.find(d => d.id === e.target.value)?.code || "";
                setFilters({ ...filters, department: e.target.value, departmentCode: code, batch: "", batchYear: 0, semester: "", subject: "" });
              }}
              className="bg-surface border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary min-w-max"
            >
              <option value="">1. Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
            </select>

            {/* Batch */}
            {filters.department && (
              <select
                value={filters.batch}
                onChange={(e) => {
                  const y = batches.find(b => b.id === e.target.value)?.year || 0;
                  setFilters({ ...filters, batch: e.target.value, batchYear: y, semester: "", subject: "" });
                }}
                className="bg-surface border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary animate-in fade-in zoom-in min-w-max"
              >
                <option value="">2. Batch</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
            )}

            {/* Semester */}
            {filters.batch && (
              <select
                value={filters.semester}
                onChange={(e) => setFilters({ ...filters, semester: e.target.value, subject: "" })}
                className="bg-surface border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary animate-in fade-in zoom-in min-w-max"
              >
                <option value="">3. Semester</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            )}

            {/* Subject (Only if Structured) */}
            {filters.semester && filters.batchYear >= 2022 && semesterSubjects.length > 0 && (
              <select
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                className="bg-surface border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary animate-in fade-in zoom-in max-w-xs truncate"
              >
                <option value="">4. Subject (Optional)</option>
                {semesterSubjects.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}

            <div className="flex-1" />

            {/* Clear button */}
            {filters.department && (
              <button 
                onClick={() => setFilters({ department: "", departmentCode: "", batch: "", batchYear: 0, semester: "", subject: "", examType: "All", year: "All" })}
                className="text-xs text-danger font-medium px-3 py-2 hover:bg-danger/10 rounded-lg min-w-max"
              >
                Clear All
              </button>
            )}
          </div>
          
          {/* Exam Type Pills */}
          {filters.semester && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border overflow-x-auto pb-1 scrollbar-hide">
              <span className="text-xs font-semibold text-text-muted mr-2">TYPE:</span>
              {["All", "Mid Term", "Final Term", "Quiz", "Assignment"].map(type => (
                <button
                  key={type}
                  onClick={() => setFilters({ ...filters, examType: type })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    filters.examType === type ? "bg-primary text-white" : "bg-surface text-text-muted border border-border hover:text-text"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {!showGrid && !searchQuery && !filters.department && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <Flame className="w-6 h-6 text-orange-500" />
                  <h2 className="text-2xl font-bold">🔥 Most Downloaded</h2>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {topResources.map((resource, i) => (
                    <motion.div key={`top-${resource.id}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
                      <Link href={`/resource/${resource.id}`} className="block h-full">
                        <div className="h-full rounded-2xl p-[1px] bg-gradient-to-br from-orange-500/20 to-transparent hover:from-orange-500/40 transition-all group">
                          <div className="h-full bg-surface rounded-2xl p-5 flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3">
                              <div className="bg-orange-500/10 text-orange-500 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                <Download className="w-3 h-3" /> {resource.download_count}
                              </div>
                            </div>
                            <h3 className="font-bold text-base mb-2 line-clamp-1 pr-12 group-hover:text-orange-500 transition-colors">
                              {resource.title}
                            </h3>
                            <div className="text-xs text-text-muted mt-auto">
                              {resource.departments?.code} • {resource.batches?.label}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Subject Grid View for Structured Batches */}
            {showGrid ? (
              <div className="glassmorphism rounded-2xl overflow-hidden border border-border">
                <div className="p-5 border-b border-border bg-surface/50">
                  <h3 className="text-lg font-bold">Curriculum Coverage</h3>
                  <p className="text-sm text-text-muted">Click on a missing slot to upload directly.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface/30">
                        <th className="p-4 border-b border-border font-medium text-sm text-text-muted">Subject</th>
                        {["Mid Term", "Final Term", "Quiz", "Assignment"].map(type => (
                          <th key={type} className="p-4 border-b border-border font-medium text-sm text-text-muted text-center">{type}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {semesterSubjects.map((subj: string) => (
                        <tr key={subj} className="border-b border-border/50 hover:bg-surface/30 transition-colors">
                          <td className="p-4 font-medium text-sm text-text">{subj}</td>
                          {["Mid Term", "Final Term", "Quiz", "Assignment"].map(type => {
                            // find if resource exists for this subj and type
                            const exists = resources.find(r => 
                              r.exam_type === type && 
                              r.resource_subjects?.some((rs: any) => rs.subjects?.name === subj)
                            );
                            return (
                              <td key={type} className="p-4 text-center">
                                {exists ? (
                                  <Link href={`/resource/${exists.id}`}>
                                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-success/10 text-success hover:bg-success/20 transition-colors" title="View Paper">
                                      <CheckCircle className="w-4 h-4" />
                                    </div>
                                  </Link>
                                ) : (
                                  <Link href={`/upload?dept=${filters.department}&batch=${filters.batch}&sem=${filters.semester}&type=${type}`}>
                                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface border border-border text-text-subtle/30 hover:text-primary hover:border-primary/50 transition-colors group" title="Upload Missing Paper">
                                      <PlusCircle className="w-4 h-4" />
                                    </div>
                                  </Link>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Regular Card Grid */
              <div>
                {resources.length === 0 ? (
                  <div className="text-center py-20 rounded-2xl border border-border bg-surface/50">
                    <FileText className="w-14 h-14 text-text-subtle/40 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-text mb-2">No resources found</h3>
                    <p className="text-text-muted text-sm">Try adjusting your filters or search query.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {resources.map((resource, i) => (
                      <motion.div key={resource.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                        <Link href={`/resource/${resource.id}`} className="block h-full">
                          <div className="h-full rounded-2xl p-[1px] bg-gradient-to-br from-border to-transparent hover:from-primary/30 transition-all duration-300 group">
                            <div className="h-full bg-surface rounded-2xl p-5 flex flex-col relative overflow-hidden">
                              
                              {/* Tags */}
                              <div className="flex items-start justify-between mb-4 relative z-10">
                                <div className="flex flex-wrap gap-2">
                                  {resource.exam_type && (
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border 
                                      ${resource.exam_type === 'Mid Term' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                                        resource.exam_type === 'Final Term' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                                        'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                                      {resource.exam_type}
                                    </span>
                                  )}
                                  {resource.resource_subjects?.length > 1 && (
                                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                                      📦 Combined ({resource.resource_subjects.length} subjs)
                                    </span>
                                  )}
                                </div>
                              </div>

                              <h3 className="font-bold text-base mb-2 line-clamp-2 text-text group-hover:text-primary transition-colors">
                                {resource.title}
                              </h3>

                              <div className="text-xs text-text-muted space-y-1.5 mb-4 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-primary/50" />
                                  {resource.departments?.code} • {resource.batches?.label} • Sem {resource.semester}
                                </div>
                                {resource.resource_subjects?.length > 0 && (
                                  <div className="flex items-start gap-1.5 text-text-subtle line-clamp-2">
                                    <span className="w-1 h-1 rounded-full bg-primary/30 mt-1.5" />
                                    {resource.resource_subjects.map((rs:any) => rs.subjects.name).join(', ')}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1 text-xs text-text-muted font-medium">
                                    <Download className="w-3.5 h-3.5" /> {resource.download_count}
                                  </div>
                                </div>
                                <div className="text-xs text-text-muted">
                                  {new Date(resource.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
