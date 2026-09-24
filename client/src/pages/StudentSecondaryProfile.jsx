import React, { useState, useEffect, useRef, useCallback } from "react";
import DashboardLayout from "../components/DashboardLayout";
import api from "../services/api";
import { AlertCircle, CheckCircle, Info, FileText } from "lucide-react";

const StudentSecondaryProfile = () => {
  const [skills, setSkills] = useState("");
  const [projects, setProjects] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeName, setResumeName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Store original values for cancel
  const original = useRef({ skills: "", projects: "", resumeName: "" });

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get("/student/secondary-profile");
      const data = res.data;
      setSkills(data.skills || "");
      setProjects(data.projects || "");
      // backend sends resume_path; extract filename
      const filename = data.resume_path ? data.resume_path.split("/").pop() : "";
      setResumeName(filename);
      original.current = {
        skills: data.skills || "",
        projects: data.projects || "",
        resumeName: filename,
      };
    } catch (err) {
      console.error("Fetch profile error:", err);
      setMessage({ type: "error", text: "Failed to load profile." });
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setMessage({ type: "error", text: "Only PDF files are allowed." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Resume must be smaller than 2 MB." });
      return;
    }
    setResumeFile(file);
    setResumeName(file.name);
    setMessage({ type: "", text: "" });
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const form = new FormData();
      form.append("skills", skills);
      form.append("projects", projects);
      if (resumeFile) {
        form.append("resume", resumeFile);
      }
      await api.post("/student/secondary-profile", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMessage({ type: "success", text: "Secondary profile updated successfully." });
      // Update displayed resume name if a new file was uploaded
      if (resumeFile) {
        setResumeName(resumeFile.name);
        setResumeFile(null);
      }
      // Refresh data from server to ensure state is up-to-date
      await fetchProfile();
    } catch (err) {
      console.error("Save error:", err.response ? err.response.data : err);
      setMessage({ type: "error", text: "Failed to save profile." });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const { skills: origSkills, projects: origProjects, resumeName: origResumeName } = original.current;
    setSkills(origSkills);
    setProjects(origProjects);
    setResumeName(origResumeName);
    setResumeFile(null);
    setMessage({ type: "", text: "" });
  };

  return (
    <DashboardLayout pageTitle="Secondary Profile">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Secondary Profile</h1>
          <p className="text-sm text-slate-400 mt-1">
            Add your technical skills, project portfolio, and verified resume to complete your placement profile.
          </p>
        </div>

        {/* Read-only Academic Policy Notice */}
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 text-xs flex items-start space-x-3">
          <Info className="w-5 h-5 flex-shrink-0 text-indigo-400 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-white">Academic Details Note:</span> Core academic credentials (Department, CGPA, and Arrear History) are directly managed and verified by the Training & Placement Officer (TPO). You can view your verified academic records on your Student Dashboard.
          </div>
        </div>

        {message.text && (
          <div
            className={`flex items-center space-x-2 p-3.5 rounded-2xl text-xs font-medium ${
              message.type === "error"
                ? "bg-red-500/10 border border-red-500/30 text-red-300"
                : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
            }`}
          >
            {message.type === "error" ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Skills Section */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800">
          <label className="block text-sm font-semibold text-slate-200 mb-2">Technical Skills</label>
          <p className="text-xs text-slate-400 mb-3">List your programming languages, frameworks, databases, and developer tools.</p>
          <textarea
            className="w-full rounded-2xl bg-slate-900/60 border border-slate-800 text-white p-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none placeholder-slate-500"
            rows={3}
            placeholder="e.g. Java, Python, React, Node.js, MySQL, Docker"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
        </div>

        {/* Projects Section */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800">
          <label className="block text-sm font-semibold text-slate-200 mb-2">Projects & Experience</label>
          <p className="text-xs text-slate-400 mb-3">Detail your academic capstone, hackathon creations, or industry internships.</p>
          <textarea
            className="w-full rounded-2xl bg-slate-900/60 border border-slate-800 text-white p-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none placeholder-slate-500"
            rows={5}
            placeholder="Describe project highlights, tech stack used, and direct outcomes..."
            value={projects}
            onChange={(e) => setProjects(e.target.value)}
          />
        </div>

        {/* Resume Section */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-1">Resume / Curriculum Vitae</label>
            <p className="text-xs text-slate-400">Upload your latest PDF resume (Maximum file size: 2MB).</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label
              htmlFor="resume-upload"
              className="cursor-pointer inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition"
            >
              <FileText className="w-4 h-4" />
              <span>{resumeName ? "Replace Resume" : "Upload PDF Resume"}</span>
            </label>
            <span className="text-xs text-slate-400 font-mono">
              {resumeName ? `Current file: ${resumeName}` : "No file selected"}
            </span>
          </div>
          <input
            id="resume-upload"
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4 pt-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
          >
            {loading ? "Saving Changes..." : "Save Changes"}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentSecondaryProfile;
