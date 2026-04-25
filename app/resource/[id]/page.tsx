"use client";

import Navbar from "@/components/Navbar";
import { Download, Star, Share2, AlertTriangle, FileText, Calendar, Building2, User, MessageSquare, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import toast from "react-hot-toast";

export default function ResourceDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [rating, setRating] = useState(0);
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResource() {
      try {
        const { data, error } = await supabase
          .from('resources')
          .select(`
            *,
            departments (name, code),
            batches (label),
            profiles (full_name, student_id)
          `)
          .eq('id', params.id)
          .single();
          
        if (error) throw error;
        setResource(data);
      } catch (error: any) {
        toast.error("Failed to load resource: " + error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchResource();
  }, [params.id, supabase]);

  const handleDownload = async () => {
    if (!resource) return;
    try {
      // Increment download count
      await supabase.rpc('increment_download_count', { row_id: resource.id });
      
      // Trigger download
      window.open(resource.file_url, '_blank');
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-bg">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen flex flex-col bg-bg">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-text-muted">
          Resource not found.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      
      <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Header Info */}
            <div className="glassmorphism p-6 rounded-2xl border border-border">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary flex-shrink-0 mt-1">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-wider">
                      {resource.type.replace('_', ' ')}
                    </span>
                    {resource.is_verified && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-success/10 text-success border border-success/20 uppercase tracking-wider">
                        Verified
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold font-syne mb-2 text-text tracking-tight">
                    {resource.title}
                  </h1>
                  <p className="text-text-muted text-sm line-clamp-3 font-medium leading-relaxed">
                    {resource.description || "No description provided."}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4 border-t border-border mt-4 font-medium">
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Building2 className="w-4 h-4" /> {resource.departments?.name}
                </div>
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <User className="w-4 h-4" /> {resource.batches?.label}
                </div>
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Calendar className="w-4 h-4" /> Semester {resource.semester}
                </div>
                {resource.year && (
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Calendar className="w-4 h-4" /> Year: {resource.year}
                  </div>
                )}
              </div>
            </div>

            {/* PDF Preview (Desktop) */}
            <div className="hidden md:flex glassmorphism p-2 rounded-2xl border border-border h-[600px] flex-col relative overflow-hidden bg-surface-2/30">
              <iframe 
                src={`${resource.file_url}#toolbar=0`} 
                className="w-full h-full rounded-xl border-none bg-white"
                title="PDF Preview"
              />
            </div>

            {/* PDF Preview Fallback (Mobile) */}
            <div className="md:hidden glassmorphism p-6 rounded-2xl border border-border flex flex-col items-center justify-center text-center gap-4 py-12">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-text">PDF Preview</h3>
              <p className="text-sm text-text-muted">In-page preview is disabled on mobile devices for better performance.</p>
              <a 
                href={resource.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-xl bg-surface hover:bg-surface-2 border border-border text-text font-bold transition-colors mt-2 flex justify-center"
              >
                Open in Full Screen
              </a>
            </div>
            
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Actions Card */}
            <div className="glassmorphism p-6 rounded-2xl border border-border flex flex-col gap-4">
              <button 
                onClick={handleDownload}
                className="w-full py-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-lg shadow-glow transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" /> Download PDF <span className="text-sm font-normal opacity-80">({(resource.file_size / (1024*1024)).toFixed(2)} MB)</span>
              </button>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied to clipboard!");
                  }}
                  className="flex-1 py-3 rounded-xl bg-surface hover:bg-surface-2 border border-border text-text font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button className="flex-1 py-3 rounded-xl bg-surface hover:bg-danger/10 border border-border hover:border-danger/30 hover:text-danger text-text font-bold transition-colors flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Report
                </button>
              </div>
            </div>

            {/* Rating Card */}
            <div className="glassmorphism p-6 rounded-2xl border border-border text-center">
              <h3 className="font-bold mb-2 text-text">Rate this resource</h3>
              <p className="text-xs text-text-muted mb-4 font-medium">Help others by rating the quality of this material.</p>
              
              <div className="flex justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star}
                    onClick={() => {
                      setRating(star);
                      toast.success(`You rated this ${star} stars!`);
                    }}
                    className="group"
                  >
                    <Star className={`w-8 h-8 transition-all ${
                      star <= rating ? "fill-warning text-warning" : "text-surface-2 group-hover:text-warning/50"
                    }`} />
                  </button>
                ))}
              </div>
              <div className="text-sm text-text-muted font-bold mt-3">
                Downloads: {resource.download_count}
              </div>
            </div>

            {/* Uploader Info */}
            <div className="glassmorphism p-6 rounded-2xl border border-border">
              <h3 className="font-bold mb-4 text-xs text-text-muted uppercase tracking-wider">Uploaded By</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-surface-2 border-2 border-primary/50 flex items-center justify-center text-primary font-bold shadow-sm">
                  {resource.profiles?.full_name ? resource.profiles.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="font-bold text-text leading-tight">{resource.profiles?.full_name || 'Anonymous'}</p>
                  <p className="text-xs text-text-muted mt-0.5 font-medium">{resource.profiles?.student_id || 'N/A'}</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
