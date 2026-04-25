"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { UploadCloud, FileText, X, AlertCircle, Loader2, CheckCircle, ChevronRight, ChevronLeft, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/utils/supabase/client";
import { curriculumData } from "@/utils/curriculumData";
import { motion, AnimatePresence } from "framer-motion";

export default function UploadPage() {
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    department_id: "",
    department_code: "",
    batch_id: "",
    batch_year: 0,
    semester: "",
    exam_type: "Mid Term",
    exam_year: new Date().getFullYear().toString(),
    selected_subjects: [] as string[], // stores subject names for checklist
    new_subject: "", // for + Add New Subject
    old_batch_subject_name: "",
    title: "",
    description: "",
    type: "past_paper"
  });

  const [existingDuplicate, setExistingDuplicate] = useState<any>(null);
  const [uploadedCount, setUploadedCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const [{ data: depts }, { data: bths }] = await Promise.all([
        supabase.from("departments").select("*"),
        supabase.from("batches").select("*"),
      ]);

      if (depts) setDepartments(depts);
      if (bths) setBatches(bths);
    }
    loadData();
  }, [supabase]);

  const isStructuredBatch = formData.batch_year >= 2022;

  // Derive subjects list from curriculum
  const semesterSubjects = formData.department_code && formData.semester 
    ? (curriculumData as any)[formData.department_code]?.[formData.semester] || []
    : [];

  const handleNextStep1 = () => {
    if (!formData.department_id || !formData.batch_id || !formData.semester || !formData.exam_type || !formData.exam_year) {
      toast.error("Please fill all required fields");
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (isStructuredBatch) {
      if (formData.selected_subjects.length === 0 && !formData.new_subject.trim()) {
        toast.error("Please select at least one subject or add a new one");
        return;
      }
    } else {
      if (!formData.old_batch_subject_name.trim()) {
        toast.error("Please enter a subject name");
        return;
      }
    }
    
    // Auto generate title if empty
    if (!formData.title) {
      const subjStr = isStructuredBatch 
        ? (formData.selected_subjects.length > 1 ? "Multiple Subjects" : (formData.selected_subjects[0] || formData.new_subject)) 
        : formData.old_batch_subject_name;
        
      setFormData(prev => ({
        ...prev,
        title: `${prev.department_code} Sem ${prev.semester} - ${subjStr} ${prev.exam_type} ${prev.exam_year}`
      }));
    }
    setStep(3);
  };

  const checkDuplicates = async () => {
    if (!isStructuredBatch) return false;
    
    // Only check if single subject is selected, to keep it simple, or check for any matching slot
    const checkSubjects = formData.selected_subjects.length > 0 ? formData.selected_subjects : [formData.new_subject];
    
    for (const subj of checkSubjects) {
      const { data } = await supabase
        .from('resources')
        .select(`id, resource_subjects!inner(subject_id)`)
        .eq('department_id', formData.department_id)
        .eq('batch_id', formData.batch_id)
        .eq('semester', parseInt(formData.semester))
        .eq('exam_type', formData.exam_type)
        .eq('year', parseInt(formData.exam_year))
        // We'd need to join subjects table to match name, but simpler to check in JS if we fetch subjects first
        // Or we can just skip complex DB side duplicate checking for now and do a simpler check.
        // Given supabase limitations without RPC, we'll do a simple check
      
      const { data: matchedResources } = await supabase
        .from('resources')
        .select(`id, title`)
        .eq('department_id', formData.department_id)
        .eq('batch_id', formData.batch_id)
        .eq('semester', parseInt(formData.semester))
        .eq('exam_type', formData.exam_type)
        .eq('year', parseInt(formData.exam_year))
        .limit(1);
        
      if (matchedResources && matchedResources.length > 0) {
        setExistingDuplicate(matchedResources[0]);
        return true; // found duplicate
      }
    }
    return false;
  };

  const handleSubmit = async (e?: React.FormEvent, ignoreDuplicate = false) => {
    if (e) e.preventDefault();
    if (!file) {
      toast.error("Please select a PDF file.");
      return;
    }
    if (!user) {
      toast.error("You must be logged in to upload.");
      return;
    }

    if (!ignoreDuplicate) {
      setIsUploading(true);
      const hasDup = await checkDuplicates();
      setIsUploading(false);
      if (hasDup) {
        return; // UI will show duplicate warning
      }
    }

    setIsUploading(true);
    setExistingDuplicate(null);
    
    try {
      // 1. Upload file
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('resources').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('resources').getPublicUrl(filePath);

      // 2. Insert main resource
      const { data: resourceData, error: dbError } = await supabase.from('resources').insert({
        title: formData.title,
        type: formData.type,
        exam_type: formData.exam_type,
        department_id: formData.department_id,
        batch_id: formData.batch_id,
        semester: parseInt(formData.semester),
        year: parseInt(formData.exam_year),
        file_url: publicUrlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        uploaded_by: user.id,
        description: formData.description,
        is_approved: true, // auto approve for now or false if you prefer
        is_old_batch: !isStructuredBatch,
        old_batch_subject_name: !isStructuredBatch ? formData.old_batch_subject_name : null,
      }).select().single();

      if (dbError) throw dbError;

      // 3. Handle Subjects for Structured Batch
      let subjectIdsToLink: string[] = [];
      
      if (isStructuredBatch) {
        // Fetch or create subjects
        const subjectsToProcess = [...formData.selected_subjects];
        if (formData.new_subject.trim()) {
          subjectsToProcess.push(formData.new_subject.trim());
        }

        for (const subjName of subjectsToProcess) {
          // find subject
          let { data: existingSubj } = await supabase
            .from('subjects')
            .select('id')
            .eq('department_id', formData.department_id)
            .eq('semester', parseInt(formData.semester))
            .ilike('name', subjName)
            .maybeSingle();

          let subjId = existingSubj?.id;
          
          if (!subjId) {
            // create custom subject
            const { data: newSubj, error: newSubjErr } = await supabase.from('subjects').insert({
              name: subjName,
              department_id: formData.department_id,
              semester: parseInt(formData.semester),
              is_custom: true,
              is_approved: false, // requires review
              created_by_user_id: user.id
            }).select().single();
            if (newSubjErr) throw newSubjErr;
            subjId = newSubj.id;
          }
          subjectIdsToLink.push(subjId);
        }

        // Link subjects in junction table
        if (subjectIdsToLink.length > 0) {
          const links = subjectIdsToLink.map(sid => ({
            resource_id: resourceData.id,
            subject_id: sid
          }));
          const { error: linkErr } = await supabase.from('resource_subjects').insert(links);
          if (linkErr) throw linkErr;
        }
      }

      setUploadedCount(isStructuredBatch ? subjectIdsToLink.length : 1);
      setStep(4);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type !== "application/pdf") {
        toast.error("Only PDF files are allowed!"); return;
      }
      if (droppedFile.size > 20 * 1024 * 1024) {
        toast.error("File size must be under 20MB!"); return;
      }
      setFile(droppedFile);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFile(null);
    setFormData({
      department_id: "", department_code: "",
      batch_id: "", batch_year: 0,
      semester: "", exam_type: "Mid Term",
      exam_year: new Date().getFullYear().toString(),
      selected_subjects: [], new_subject: "", old_batch_subject_name: "",
      title: "", description: "", type: "past_paper"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-bold font-syne mb-4 text-gradient">
            Contribute to MUET Hub
          </h1>
          <p className="text-text-muted">
            Upload past papers and resources to help your fellow MUETians.
          </p>
        </div>

        {/* Stepper */}
        {step < 4 && (
          <div className="flex items-center justify-between mb-8 px-4 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface -z-10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300" 
                style={{ width: `${((step - 1) / 2) * 100}%` }} 
              />
            </div>
            {[1, 2, 3].map(s => (
              <div 
                key={s} 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors duration-300 ${
                  step >= s ? 'bg-primary text-white shadow-glow' : 'bg-surface border border-border text-text-muted'
                }`}
              >
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
            ))}
          </div>
        )}

        <div className="glassmorphism p-6 md:p-10 rounded-3xl relative overflow-hidden">
          
          <AnimatePresence mode="wait">
            {/* STEP 1: Basic Info */}
            {step === 1 && (
              <motion.div 
                key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="text-primary">01.</span> Basic Info
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Department *</label>
                    <select 
                      value={formData.department_id}
                      onChange={e => {
                        const dept = departments.find(d => d.id === e.target.value);
                        setFormData({...formData, department_id: e.target.value, department_code: dept?.code || "", selected_subjects: []});
                      }}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-text"
                    >
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Batch Year *</label>
                    <select 
                      value={formData.batch_id}
                      onChange={e => {
                        const b = batches.find(x => x.id === e.target.value);
                        setFormData({...formData, batch_id: e.target.value, batch_year: b?.year || 0, selected_subjects: []});
                      }}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-text"
                    >
                      <option value="">Select Batch</option>
                      {batches.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Semester *</label>
                    <select 
                      value={formData.semester}
                      onChange={e => setFormData({...formData, semester: e.target.value, selected_subjects: []})}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-text"
                    >
                      <option value="">Select Semester</option>
                      {[1,2,3,4,5,6,7,8].map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Year of Exam *</label>
                    <select 
                      value={formData.exam_year}
                      onChange={e => setFormData({...formData, exam_year: e.target.value})}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-text"
                    >
                      <option value="">Select Year</option>
                      {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Exam Type *</label>
                  <div className="flex flex-wrap gap-3">
                    {["Mid Term", "Final Term", "Quiz", "Assignment", "Other"].map(type => (
                      <label key={type} className={`cursor-pointer border rounded-xl py-2 px-4 transition-all ${
                        formData.exam_type === type 
                        ? 'border-primary bg-primary/10 text-primary font-medium' 
                        : 'border-border bg-surface text-text-muted hover:border-text-muted'
                      }`}>
                        <input 
                          type="radio" className="hidden" 
                          checked={formData.exam_type === type}
                          onChange={() => setFormData({...formData, exam_type: type})}
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button onClick={handleNextStep1} className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">
                    Next Step <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Subject Selection */}
            {step === 2 && (
              <motion.div 
                key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="text-primary">02.</span> Subject Selection
                </h2>

                {isStructuredBatch ? (
                  <div className="space-y-4">
                    <p className="text-sm text-text-muted mb-4">
                      Select one or multiple subjects for this paper (creates a virtual link for multi-subject PDFs).
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {semesterSubjects.map((subj: string) => (
                        <label key={subj} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          formData.selected_subjects.includes(subj) ? 'border-primary bg-primary/5' : 'border-border bg-surface'
                        }`}>
                          <input 
                            type="checkbox" 
                            className="mt-1 w-4 h-4 text-primary bg-surface border-border rounded focus:ring-primary"
                            checked={formData.selected_subjects.includes(subj)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({...formData, selected_subjects: [...formData.selected_subjects, subj]});
                              } else {
                                setFormData({...formData, selected_subjects: formData.selected_subjects.filter(s => s !== subj)});
                              }
                            }}
                          />
                          <span className={`text-sm font-medium ${formData.selected_subjects.includes(subj) ? 'text-primary' : 'text-text'}`}>
                            {subj}
                          </span>
                        </label>
                      ))}
                    </div>

                    <div className="mt-6 border-t border-border pt-6">
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-primary" /> Add New Subject (Not in list)
                      </label>
                      <input 
                        type="text" 
                        value={formData.new_subject}
                        onChange={e => setFormData({...formData, new_subject: e.target.value})}
                        placeholder="Type subject name..."
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-text"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject Name (Free Text) *</label>
                    <p className="text-xs text-text-muted mb-3">Older batches use simplified free-form subject entry.</p>
                    <input 
                      type="text" 
                      value={formData.old_batch_subject_name}
                      onChange={e => setFormData({...formData, old_batch_subject_name: e.target.value})}
                      placeholder="e.g. Applied Physics"
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-text"
                    />
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep(1)} className="bg-surface hover:bg-surface-2 text-text px-6 py-3 rounded-xl font-medium flex items-center gap-2 border border-border">
                    <ChevronLeft className="w-5 h-5" /> Back
                  </button>
                  <button onClick={handleNextStep2} className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">
                    Next Step <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: File Upload */}
            {step === 3 && (
              <motion.div 
                key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="text-primary">03.</span> File Upload
                </h2>

                <div className="flex flex-wrap gap-2 mb-6">
                  {isStructuredBatch && formData.selected_subjects.map(s => (
                    <span key={s} className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full">{s}</span>
                  ))}
                  {isStructuredBatch && formData.new_subject && (
                    <span className="bg-warning/20 text-warning text-xs font-bold px-3 py-1 rounded-full">{formData.new_subject} (New)</span>
                  )}
                  {!isStructuredBatch && formData.old_batch_subject_name && (
                    <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full">{formData.old_batch_subject_name}</span>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Resource Title (Optional)</label>
                    <input 
                      type="text" 
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-text"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      rows={2}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-text resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Upload File (PDF only, max 20MB) *</label>
                  {!file ? (
                    <div 
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-10 text-center bg-surface/50 transition-colors group cursor-pointer relative"
                    >
                      <input 
                        type="file" accept=".pdf" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if(f) {
                            if(f.type !== "application/pdf") { toast.error("Only PDF files are allowed!"); return; }
                            if(f.size > 20 * 1024 * 1024) { toast.error("File size must be under 20MB!"); return; }
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
                        type="button" onClick={() => setFile(null)}
                        className="p-2 bg-surface hover:bg-danger/20 text-text-muted hover:text-danger rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {existingDuplicate && (
                  <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-text">
                        A paper for this slot already exists: <span className="font-bold">{existingDuplicate.title}</span>. 
                      </p>
                    </div>
                    <div className="flex justify-end gap-3 mt-2">
                      <button onClick={() => setExistingDuplicate(null)} className="px-4 py-2 text-sm rounded-lg border border-border text-text hover:bg-surface transition-colors">
                        Cancel
                      </button>
                      <button onClick={(e) => handleSubmit(e, true)} className="px-4 py-2 text-sm rounded-lg bg-warning text-warning-foreground font-bold hover:bg-warning/80 transition-colors">
                        Upload Anyway (Alternate)
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep(2)} disabled={isUploading} className="bg-surface hover:bg-surface-2 text-text px-6 py-3 rounded-xl font-medium flex items-center gap-2 border border-border">
                    <ChevronLeft className="w-5 h-5" /> Back
                  </button>
                  {!existingDuplicate && (
                    <button 
                      onClick={(e) => handleSubmit(e, false)} 
                      disabled={isUploading || !file} 
                      className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-70"
                    >
                      {isUploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</> : <><UploadCloud className="w-5 h-5" /> Upload</>}
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 4: Confirmation */}
            {step === 4 && (
              <motion.div 
                key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-6"
              >
                <div className="w-24 h-24 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-bold">Upload Successful! 🎉</h2>
                <p className="text-text-muted max-w-md mx-auto">
                  Your paper is now visible in <span className="text-primary font-bold">{uploadedCount}</span> subject slot(s).
                  Thank you for contributing to the MUET Hub!
                </p>
                <div className="pt-6">
                  <button onClick={resetForm} className="bg-surface hover:bg-surface-2 text-text border border-border px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mx-auto transition-colors">
                    <Plus className="w-5 h-5" /> Upload Another
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
