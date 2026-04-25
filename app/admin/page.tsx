"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { LayoutDashboard, Users, FileCheck, AlertTriangle, ShieldCheck, Download, Search, Check, X, Loader2, Trash2, BookOpen, ExternalLink } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingResources, setPendingResources] = useState<any[]>([]);
  const [pendingSubjects, setPendingSubjects] = useState<any[]>([]);
  const [allResources, setAllResources] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, users: 0, downloads: 0, pendingSubjects: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch Pending
      const { data: pending } = await supabase
        .from('resources')
        .select(`
          *,
          profiles:uploaded_by (full_name, student_id),
          departments:department_id (code),
          batches:batch_id (label)
        `)
        .eq('is_approved', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (pending) setPendingResources(pending);

      // Fetch Pending Subjects
      const { data: pSubs } = await supabase
        .from('subjects')
        .select(`*, departments(code)`)
        .eq('is_custom', true)
        .eq('is_approved', false)
        .order('created_at', { ascending: false });
      
      if (pSubs) setPendingSubjects(pSubs);

      // Fetch All Resources (for the "All Resources" tab)
      const { data: all } = await supabase
        .from('resources')
        .select(`
          *,
          profiles:uploaded_by (full_name, student_id),
          departments:department_id (code),
          batches:batch_id (label)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (all) setAllResources(all);

      // Fetch Stats
      const [{ count: totalRes }, { count: pendRes }, { count: totalUsers }, { count: pendSub }] = await Promise.all([
        supabase.from('resources').select('*', { count: 'exact', head: true }),
        supabase.from('resources').select('*', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('is_custom', true).eq('is_approved', false),
      ]);

      setStats({
        total: totalRes || 0,
        pending: pendRes || 0,
        users: totalUsers || 0,
        downloads: 0,
        pendingSubjects: pendSub || 0
      });

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleApproveSubject = async (id: string) => {
    try {
      const { error } = await supabase.from('subjects').update({ is_approved: true }).eq('id', id);
      if (error) throw error;
      toast.success("Subject approved and merged into curriculum!");
      setPendingSubjects(prev => prev.filter(s => s.id !== id));
      setStats(prev => ({ ...prev, pendingSubjects: prev.pendingSubjects - 1 }));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm("Are you sure? Deleting this subject will NOT delete linked resources but they will become harder to find.")) return;
    try {
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (error) throw error;
      toast.success("Custom subject deleted.");
      setPendingSubjects(prev => prev.filter(s => s.id !== id));
      setStats(prev => ({ ...prev, pendingSubjects: prev.pendingSubjects - 1 }));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase.from('resources').update({ is_approved: true }).eq('id', id);
      if (error) throw error;
      toast.success("Resource approved!");
      setPendingResources(prev => prev.filter(r => r.id !== id));
      setAllResources(prev => prev.map(r => r.id === id ? { ...r, is_approved: true } : r));
      setStats(prev => ({ ...prev, pending: prev.pending - 1 }));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject and delete this resource?")) return;
    try {
      const { error } = await supabase.from('resources').delete().eq('id', id);
      if (error) throw error;
      toast.success("Resource rejected and deleted.");
      setPendingResources(prev => prev.filter(r => r.id !== id));
      setAllResources(prev => prev.filter(r => r.id !== id));
      setStats(prev => ({ ...prev, pending: prev.pending - 1 }));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"? This action cannot be undone.`)) return;
    setDeletingId(id);
    try {
      // Also delete the file from storage if needed
      const resource = allResources.find(r => r.id === id);
      if (resource?.file_url) {
        // Extract storage path from URL (file is in 'resources' bucket)
        const urlParts = resource.file_url.split('/resources/');
        if (urlParts.length > 1) {
          const filePath = decodeURIComponent(urlParts[urlParts.length - 1]);
          await supabase.storage.from('resources').remove([filePath]);
        }
      }

      const { error } = await supabase.from('resources').delete().eq('id', id);
      if (error) throw error;
      toast.success("Resource permanently deleted.");
      setAllResources(prev => prev.filter(r => r.id !== id));
      setPendingResources(prev => prev.filter(r => r.id !== id));
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
        pending: resource?.is_approved === false ? prev.pending - 1 : prev.pending,
      }));
    } catch (error: any) {
      toast.error(error.message || "Failed to delete resource.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filter + search logic for All Resources tab
  const filteredResources = allResources.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || r.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      
      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Admin Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="glassmorphism rounded-2xl p-6 sticky top-24">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold font-syne text-lg leading-tight text-text">Admin</h2>
                <p className="text-xs text-text-muted">Dashboard</p>
              </div>
            </div>

            <nav className="space-y-2">
              <button 
                onClick={() => setActiveTab("overview")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  activeTab === "overview" ? "bg-primary text-white shadow-glow" : "text-text-muted hover:text-text hover:bg-surface-2"
                }`}
              >
                <LayoutDashboard className="w-5 h-5" /> Overview
              </button>
              <button 
                onClick={() => setActiveTab("pending")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  activeTab === "pending" ? "bg-warning text-white shadow-glow" : "text-text-muted hover:text-text hover:bg-surface-2"
                }`}
              >
                <FileCheck className="w-5 h-5" /> Pending Approvals
                <span className="ml-auto bg-white/20 text-white px-2 py-0.5 rounded-full text-xs">{stats.pending}</span>
              </button>
              <button 
                onClick={() => setActiveTab("resources")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  activeTab === "resources" ? "bg-primary text-white shadow-glow" : "text-text-muted hover:text-text hover:bg-surface-2"
                }`}
              >
                <BookOpen className="w-5 h-5" /> All Resources
                <span className="ml-auto bg-white/20 text-white px-2 py-0.5 rounded-full text-xs">{stats.total}</span>
              </button>
              <button 
                onClick={() => setActiveTab("subjects")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  activeTab === "subjects" ? "bg-orange-500 text-white shadow-glow" : "text-text-muted hover:text-text hover:bg-surface-2"
                }`}
              >
                <BookOpen className="w-5 h-5" /> Subjects Review
                <span className="ml-auto bg-white/20 text-white px-2 py-0.5 rounded-full text-xs">{stats.pendingSubjects}</span>
              </button>
              <button 
                onClick={() => setActiveTab("users")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  activeTab === "users" ? "bg-primary text-white shadow-glow" : "text-text-muted hover:text-text hover:bg-surface-2"
                }`}
              >
                <Users className="w-5 h-5" /> Manage Users
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {activeTab === "overview" && (
            <div className="space-y-8">
              <h1 className="text-2xl font-bold font-syne text-text">Platform Overview</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Resources", value: stats.total, icon: FileCheck, color: "text-primary", bg: "bg-primary/10" },
                  { label: "Pending Approvals", value: stats.pending, icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
                  { label: "Total Users", value: stats.users, icon: Users, color: "text-success", bg: "bg-success/10" },
                  { label: "Downloads Today", value: stats.downloads, icon: Download, color: "text-accent", bg: "bg-accent/10" },
                ].map((stat, i) => (
                  <div key={i} className="glassmorphism p-6 rounded-2xl flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-text">{stat.value}</div>
                      <div className="text-xs text-text-muted font-medium">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "pending" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold font-syne text-text">Pending Approvals</h1>
                <button onClick={fetchData} className="text-sm text-primary hover:underline">Refresh</button>
              </div>

              <div className="glassmorphism rounded-2xl overflow-hidden border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-2/50 border-b border-border text-sm text-text-muted">
                        <th className="px-6 py-4 font-medium">Resource Title</th>
                        <th className="px-6 py-4 font-medium">Uploader</th>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-text-muted">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                            Loading...
                          </td>
                        </tr>
                      ) : pendingResources.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-text-muted">
                            No pending resources. You are all caught up!
                          </td>
                        </tr>
                      ) : pendingResources.map((resource) => (
                        <tr key={resource.id} className="hover:bg-surface-2/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="font-medium text-text mb-1">{resource.title}</div>
                            <div className="text-xs text-text-muted flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 uppercase">{resource.type.replace('_', ' ')}</span>
                              {resource.departments?.code} • {resource.batches?.label}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-text">{resource.profiles?.full_name || 'Unknown User'}</div>
                            <div className="text-xs text-text-muted">{resource.profiles?.student_id || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-text-muted">
                            {new Date(resource.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <a href={resource.file_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface hover:bg-surface-2 rounded-lg text-text-muted transition-colors border border-border" title="Preview">
                                <Search className="w-4 h-4" />
                              </a>
                              <button onClick={() => handleApprove(resource.id)} className="p-2 bg-success/20 hover:bg-success text-success hover:text-white rounded-lg transition-colors border border-success/30" title="Approve">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleReject(resource.id)} className="p-2 bg-danger/20 hover:bg-danger text-danger hover:text-white rounded-lg transition-colors border border-danger/30" title="Reject">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "resources" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold font-syne text-text">All Resources</h1>
                <button onClick={fetchData} className="text-sm text-primary hover:underline">Refresh</button>
              </div>

              {/* Search & Filter Bar */}
              <div className="glassmorphism rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search resources by title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-text text-sm"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-surface border border-border focus:border-primary outline-none text-text text-sm appearance-none cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="past_paper">Past Papers</option>
                  <option value="notes">Notes</option>
                  <option value="handout">Handouts</option>
                </select>
              </div>

              {/* Resources Table */}
              <div className="glassmorphism rounded-2xl overflow-hidden border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-2/50 border-b border-border text-sm text-text-muted">
                        <th className="px-6 py-4 font-medium">Resource</th>
                        <th className="px-6 py-4 font-medium">Uploader</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                            Loading...
                          </td>
                        </tr>
                      ) : filteredResources.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                            {searchQuery || filterType !== "all" ? "No resources match your search." : "No resources found."}
                          </td>
                        </tr>
                      ) : filteredResources.map((resource) => (
                        <tr key={resource.id} className="hover:bg-surface-2/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="font-medium text-text mb-1 line-clamp-1">{resource.title}</div>
                            <div className="text-xs text-text-muted flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 uppercase text-[10px] font-bold">{resource.type.replace('_', ' ')}</span>
                              <span>{resource.departments?.code || '—'}</span>
                              <span>•</span>
                              <span>Sem {resource.semester || '—'}</span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5"><Download className="w-3 h-3" />{resource.download_count || 0}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-text">{resource.profiles?.full_name || 'Unknown'}</div>
                            <div className="text-xs text-text-muted">{resource.profiles?.student_id || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4">
                            {resource.is_approved ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-success/20 text-success border border-success/30 uppercase tracking-wider">
                                Approved
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-warning/20 text-warning border border-warning/30 uppercase tracking-wider">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-text-muted whitespace-nowrap">
                            {new Date(resource.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <a
                                href={resource.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-surface hover:bg-surface-2 rounded-lg text-text-muted hover:text-text transition-colors border border-border"
                                title="View file"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              {!resource.is_approved && (
                                <button
                                  onClick={() => handleApprove(resource.id)}
                                  className="p-2 bg-success/20 hover:bg-success text-success hover:text-white rounded-lg transition-colors border border-success/30"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(resource.id, resource.title)}
                                disabled={deletingId === resource.id}
                                className="p-2 bg-danger/20 hover:bg-danger text-danger hover:text-white rounded-lg transition-colors border border-danger/30 disabled:opacity-50"
                                title="Delete resource"
                              >
                                {deletingId === resource.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Results count footer */}
                {!loading && (
                  <div className="px-6 py-3 border-t border-border bg-surface-2/30 text-xs text-text-muted">
                    Showing {filteredResources.length} of {allResources.length} resources
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="glassmorphism p-8 rounded-2xl text-center">
              <Users className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2 text-text">User Management</h3>
              <p className="text-text-muted">This module is under construction.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
