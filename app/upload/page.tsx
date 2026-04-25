"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { UploadCloud, FileText, X, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/utils/supabase/client";

export default function UploadPage() {
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    type: "past_paper",
    department_id: "",
    batch_id: "",
    subject_id: "",
    semester: "",
    year: "",
    description: "",
  });

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const [{ data: depts }, { data: bths }, { data: subs }] = await Promise.all([
        supabase.from("departments").select("*"),
        supabase.from("batches").select("*"),
        supabase.from("subjects").select("*"),
      ]);

      if (depts) setDepartments(depts);
      if (bths) setBatches(bths);
      if (subs) setSubjects(subs);
    }
    loadData();
  }, [supabase]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type !== "application/pdf") {
        toast.error("Only PDF files are allowed!");
        return;
      }
      if (droppedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be under 10MB!");
        return;
      }
      setFile(droppedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }
    if (!user) {
      toast.error("You must be logged in to upload.");
      return;
    }

    setIsUploading(true);
    
    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('resources')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('resources')
        .getPublicUrl(filePath);

      // 3. Insert into Database
      const { error: dbError } = await supabase.from('resources').insert({
        title: formData.title,
        type: formData.type,
        department_id: formData.department_id,
        batch_id: formData.batch_id,
        subject_id: formData.subject_id || null, // Optional if subject not found
        semester: parseInt(formData.semester),
        year: formData.year ? parseInt(formData.year) : null,
        file_url: publicUrlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        uploaded_by: user.id,
        description: formData.description,
        is_approved: false, // Requires admin approval
      });

      if (dbError) throw dbError;

      toast.success("✅ Uploaded successfully! Your resource will be visible after admin approval.", {
        duration: 5000,
        style: {
          background: 'var(--surface-2)',
          color: 'var(--text)',
          border: '1px solid var(--success)',
        }
      });
      setFile(null);
      setFormData({
        title: "",
        type: "past_paper",
        department_id: "",
        batch_id: "",
        subject_id: "",
        semester: "",
        year: "",
        description: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-bold font-syne mb-4 text-gradient">
            Contribute to MUET Hub
          </h1>
          <p className="text-text-muted">
            Upload past papers, notes, or handouts to help your fellow MUETians.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glassmorphism p-6 md:p-10 rounded-3xl space-y-8 relative overflow-hidden">
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Resource Title *</label>
              <input 
                required
                type="text" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Midterm 2023 - Data Structures"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-text"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Resource Type *</label>
              <div className="flex flex-wrap gap-4">
                {[
                  { id: 'past_paper', label: 'Past Paper' },
                  { id: 'notes', label: 'Study Notes' },
                  { id: 'handout', label: 'Practical Handout' }
                ].map(type => (
                  <label key={type.id} className={`flex-1 cursor-pointer border rounded-xl py-3 px-4 text-center transition-all ${
                    formData.type === type.id 
                    ? 'border-primary bg-primary/10 text-primary font-medium shadow-glow' 
                    : 'border-border bg-surface text-text-muted hover:border-text-muted'
                  }`}>
                    <input 
                      type="radio" 
                      name="type" 
                      value={type.id}
                      checked={formData.type === type.id}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                      className="hidden" 
                    />
                    {type.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Department *</label>
                <select 
                  required
                  value={formData.department_id}
                  onChange={e => setFormData({...formData, department_id: e.target.value})}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-text"
                >
                  <option value="" disabled>Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Batch *</label>
                <select 
                  required
                  value={formData.batch_id}
                  onChange={e => setFormData({...formData, batch_id: e.target.value})}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-text"
                >
                  <option value="" disabled>Select Batch</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Semester *</label>
                <select 
                  required
                  value={formData.semester}
                  onChange={e => setFormData({...formData, semester: e.target.value})}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-text"
                >
                  <option value="" disabled>Select Semester</option>
                  {[1,2,3,4,5,6,7,8].map(sem => (
                    <option key={sem} value={sem}>{sem}{sem===1?'st':sem===2?'nd':sem===3?'rd':'th'} Semester</option>
                  ))}
                </select>
              </div>

              {formData.type === 'past_paper' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Exam Year *</label>
                  <select 
                    required
                    value={formData.year}
                    onChange={e => setFormData({...formData, year: e.target.value})}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-text"
                  >
                    <option value="" disabled>Select Year</option>
                    {[2025, 2024, 2023, 2022, 2021, 2020].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Subject (Optional)</label>
              <select 
                value={formData.subject_id}
                onChange={e => setFormData({...formData, subject_id: e.target.value})}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-text"
              >
                <option value="">Select Subject</option>
                {subjects
                  .filter(s => s.department_id === formData.department_id || !formData.department_id)
                  .map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Add any extra details..."
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-text resize-none"
                rows={3}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Upload File (PDF only, max 10MB) *</label>
            {!file ? (
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-10 text-center bg-surface/50 transition-colors group cursor-pointer relative"
              >
                <input 
                  type="file" 
                  accept=".pdf" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if(f) {
                      if(f.type !== "application/pdf") {
                        toast.error("Only PDF files are allowed!");
                        return;
                      }
                      if(f.size > 10 * 1024 * 1024) {
                        toast.error("File size must be under 10MB!");
                        return;
                      }
                      setFile(f);
                    }
                  }}
                />
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="font-medium text-lg mb-1">Drag & drop your file here</p>
                <p className="text-text-muted text-sm">or click to browse from your device</p>
              </div>
            ) : (
              <div className="glassmorphism border-primary/30 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-medium text-text truncate max-w-[200px] sm:max-w-sm">{file.name}</p>
                    <p className="text-xs text-text-muted">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-2 bg-surface hover:bg-danger/20 text-text-muted hover:text-danger rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-text-muted">
              By uploading, you confirm that this material does not violate any university policies and belongs to the specified department and batch.
            </p>
          </div>

          <button 
            type="submit"
            disabled={isUploading}
            className="w-full py-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-lg shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadCloud className="w-6 h-6" />
                Submit Resource
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
}
