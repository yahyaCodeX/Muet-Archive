"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Mail, Lock, UserPlus, ArrowRight, User, GraduationCap, Building2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/client";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    studentId: "",
    email: "",
    department: "",
    batch: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            student_id: formData.studentId,
          }
        }
      });

      if (authError) throw authError;

      // The trigger or our manual insert creates the profile
      if (authData.user) {
        // Find department and batch IDs (In a real app, you'd fetch these from DB to populate dropdowns, 
        // but since we only have text inputs/values right now, we can query them first)
        const { data: deptData } = await supabase.from('departments').select('id').eq('code', formData.department).single();
        const { data: batchData } = await supabase.from('batches').select('id').eq('label', formData.batch).single();

        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.fullName,
            student_id: formData.studentId,
            department_id: deptData?.id || null,
            batch_id: batchData?.id || null,
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;
      }

      toast.success("Account created successfully!");
      window.location.href = "/browse";
    } catch (error: any) {
      toast.error(error.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-bg">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center p-4 relative z-10 my-8">
        <div className="w-full max-w-lg">
          <div className="glassmorphism rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold font-syne mb-2 text-text">Join MUET Hub</h1>
              <p className="text-text-muted text-sm">Create an account to start contributing and downloading</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-muted">Full Name</label>
                  <div className="relative">
                    <User className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      placeholder="Ali Khan"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-text-muted">Student ID</label>
                  <div className="relative">
                    <BookOpen className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      required
                      value={formData.studentId}
                      onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                      placeholder="22CS001"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-text uppercase"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-muted">MUET Email Address</label>
                <div className="relative">
                  <Mail className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="22cs001@students.muet.edu.pk"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-muted">Department</label>
                  <div className="relative">
                    <Building2 className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <select
                      required
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-text appearance-none"
                    >
                      <option value="" disabled>Select Dept</option>
                      <option value="CSE">CSE</option>
                      <option value="SE">SE</option>
                      <option value="EE">EE</option>
                      <option value="ME">ME</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-text-muted">Batch</label>
                  <div className="relative">
                    <GraduationCap className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <select
                      required
                      value={formData.batch}
                      onChange={(e) => setFormData({...formData, batch: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-text appearance-none"
                    >
                      <option value="" disabled>Select Batch</option>
                      <option value="22-Batch">22-Batch</option>
                      <option value="21-Batch">21-Batch</option>
                      <option value="20-Batch">20-Batch</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-muted">Password</label>
                <div className="relative">
                  <Lock className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-text"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-glow hover:scale-[1.02] disabled:opacity-70"
              >
                <UserPlus className="w-5 h-5" />
                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>

            <div className="mt-8 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-surface text-text-muted rounded-full">Or continue with</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={async () => {
                try {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: `${window.location.origin}/auth/callback`,
                    },
                  });
                  if (error) throw error;
                } catch (error: any) {
                  toast.error(error.message || "Failed to sign up with Google.");
                }
              }}
              className="mt-6 w-full py-3 rounded-xl bg-surface hover:bg-surface-2 border border-border text-text font-medium flex items-center justify-center gap-3 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>

            <p className="mt-8 text-center text-sm text-text-muted">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:text-accent font-medium inline-flex items-center gap-1 transition-colors group">
                Sign in <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
