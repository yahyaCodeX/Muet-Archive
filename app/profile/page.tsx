"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Mail, GraduationCap, Building2, UploadCloud, DownloadCloud, Award, BookOpen, Star, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function ProfilePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [contributions, setContributions] = useState<any[]>([]);
  const [stats, setStats] = useState({ uploads: 0, downloads: 0, rating: 0 });

  useEffect(() => {
    async function fetchProfileData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserEmail(user.email || "");

        // Fetch profile with dept and batch
        const { data: profileData } = await supabase
          .from('profiles')
          .select(`
            *,
            departments (code, name),
            batches (label)
          `)
          .eq('id', user.id)
          .single();

        setProfile(profileData);

        // Fetch user's uploaded resources
        const { data: resourcesData } = await supabase
          .from('resources')
          .select(`
            *,
            departments (code),
            batches (label)
          `)
          .eq('uploaded_by', user.id)
          .order('created_at', { ascending: false });

        if (resourcesData) {
          setContributions(resourcesData);
          
          const totalDownloads = resourcesData.reduce((acc, curr) => acc + (curr.download_count || 0), 0);
          
          setStats({
            uploads: resourcesData.length,
            downloads: totalDownloads,
            rating: 0 // Mocked for now until ratings are implemented
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfileData();
  }, [supabase]);

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

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col bg-bg">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-text-muted">
          Failed to load profile.
        </div>
      </div>
    );
  }

  // Get Initials
  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-5xl flex-1">
        
        {/* Profile Header */}
        <div className="glassmorphism rounded-3xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/10 rounded-full mix-blend-screen filter blur-[80px] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-surface-2 border-4 border-surface flex items-center justify-center text-4xl font-bold font-syne text-white shadow-xl overflow-hidden">
                <span className="bg-gradient-to-br from-primary to-accent inset-0 absolute opacity-20" />
                {getInitials(profile.full_name)}
              </div>
              {stats.uploads > 5 && (
                <div className="absolute -bottom-2 -right-2 bg-warning text-white p-2 rounded-full shadow-glow" title="Top Contributor">
                  <Award className="w-6 h-6" />
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2 justify-center md:justify-start">
                <h1 className="text-3xl font-bold font-syne text-text">{profile.full_name || 'Anonymous User'}</h1>
                <span className={`px-3 py-1 text-xs font-bold rounded-full border uppercase tracking-wider ${
                  profile.role === 'admin' 
                  ? 'bg-warning/20 text-warning border-warning/30' 
                  : 'bg-primary/20 text-primary border-primary/30'
                }`}>
                  {profile.role}
                </span>
              </div>
              <p className="text-text-muted mb-6 flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-4 h-4" /> {userEmail}
                <span className="ml-2 px-2 py-0.5 rounded bg-surface-2 text-xs">{profile.student_id}</span>
              </p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 bg-surface p-3 rounded-xl border border-white/5">
                  <Building2 className="w-5 h-5 text-accent" />
                  <div className="text-left">
                    <p className="text-xs text-text-muted">Department</p>
                    <p className="font-semibold text-sm text-text">{profile.departments?.name || 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-surface p-3 rounded-xl border border-white/5">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <p className="text-xs text-text-muted">Batch</p>
                    <p className="font-semibold text-sm text-text">{profile.batches?.label || 'Not set'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:w-64 w-full grid grid-cols-2 gap-4">
              <div className="bg-surface/50 p-4 rounded-2xl text-center border border-white/5">
                <div className="text-3xl font-bold text-text mb-1">{stats.uploads}</div>
                <div className="text-xs text-text-muted flex items-center justify-center gap-1">
                  <UploadCloud className="w-3 h-3" /> Uploads
                </div>
              </div>
              <div className="bg-surface/50 p-4 rounded-2xl text-center border border-white/5">
                <div className="text-3xl font-bold text-text mb-1">
                  {stats.rating > 0 ? stats.rating.toFixed(1) : 'N/A'}
                </div>
                <div className="text-xs text-text-muted flex items-center justify-center gap-1">
                  <Star className="w-3 h-3 text-warning" /> Avg Rating
                </div>
              </div>
              <div className="col-span-2 bg-surface/50 p-4 rounded-2xl text-center border border-white/5">
                <div className="text-2xl font-bold text-text mb-1">{stats.downloads}</div>
                <div className="text-xs text-text-muted flex items-center justify-center gap-1">
                  <DownloadCloud className="w-3 h-3" /> Total Downloads Received
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Uploads Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-text">
            <BookOpen className="w-6 h-6 text-primary" /> My Contributions
          </h2>
          
          {contributions.length === 0 ? (
            <div className="text-center py-12 glassmorphism rounded-2xl border border-border">
              <UploadCloud className="w-12 h-12 text-text-muted/50 mx-auto mb-3" />
              <p className="text-text-muted">You haven&apos;t uploaded any resources yet.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {contributions.map((item) => (
                <div key={item.id} className="glassmorphism p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-primary/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary flex-shrink-0">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-text group-hover:text-primary transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-text-muted mt-1">
                        Uploaded {new Date(item.created_at).toLocaleDateString()} • {item.departments?.code || 'N/A'} • Sem {item.semester}
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        {item.is_approved ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-success/20 text-success border border-success/30 uppercase tracking-wider">
                            Approved
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning/20 text-warning border border-warning/30 uppercase tracking-wider">
                            Pending
                          </span>
                        )}
                        <span className="text-xs text-text-muted flex items-center gap-1 font-medium">
                          <DownloadCloud className="w-3 h-3" /> {item.download_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
