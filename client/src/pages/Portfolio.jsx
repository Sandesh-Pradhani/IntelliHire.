import { useState, useEffect, useCallback } from 'react';
import {
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, FolderGit2,
  Award, Code2, Link as LinkIcon, Globe, ChevronDown, ChevronRight,
  Plus, Pencil, Trash2, X, Check, Loader2, Star, Calendar, ExternalLink,
  BarChart3, Building2, BookOpen, Trophy, Languages, TrendingUp, Save,
  AlertCircle, CheckCircle, Eye, EyeOff
} from 'lucide-react';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function apiRequest(endpoint, method = 'GET', body = null) {
  const opts = { method, headers: getAuthHeaders() };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${endpoint}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

function Section({ title, icon: Icon, children, defaultOpen = true, count }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <Icon size={20} />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          {count !== undefined && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{count}</span>
          )}
        </div>
        <div className="text-gray-400">
          {open ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </button>
      {open && <div className="px-6 pb-6 border-t border-gray-50">{children}</div>}
    </div>
  );
}

function ConfirmModal({ open, onClose, onConfirm, title, message }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-red-50 rounded-lg text-red-600"><AlertCircle size={20} /></div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message, onAdd, addLabel = 'Add' }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="p-3 bg-gray-100 rounded-xl text-gray-400 mb-3">
        <Icon size={32} />
      </div>
      <p className="text-gray-500 mb-4">{message}</p>
      {onAdd && (
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={16} /> {addLabel}
        </button>
      )}
    </div>
  );
}

function ProgressBar({ percentage }) {
  const color = percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-12 text-right">{percentage}%</span>
    </div>
  );
}

function FieldGroup({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Input({ className = '', ...props }) {
  return <input className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${className}`} {...props} />;
}

function Textarea({ className = '', ...props }) {
  return <textarea className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none ${className}`} {...props} />;
}

function Select({ className = '', children, ...props }) {
  return <select className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white ${className}`} {...props}>{children}</select>;
}

function TagInput({ tags, onChange, placeholder = 'Add tag...' }) {
  const [input, setInput] = useState('');
  const addTag = () => {
    const t = input.trim();
    if (t && !tags.includes(t)) { onChange([...tags, t]); setInput(''); }
  };
  const removeTag = (idx) => onChange(tags.filter((_, i) => i !== idx));
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-2">
        {tags.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
            {tag}
            <button type="button" onClick={() => removeTag(i)} className="hover:text-blue-900"><X size={12} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder={placeholder} />
        <button type="button" onClick={addTag} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors">Add</button>
      </div>
    </div>
  );
}

const PLATFORMS = [
  { value: 'leetcode', label: 'LeetCode' },
  { value: 'hackerrank', label: 'HackerRank' },
  { value: 'codechef', label: 'CodeChef' },
  { value: 'codeforces', label: 'Codeforces' },
  { value: 'geeksforgeeks', label: 'GeeksforGeeks' },
];

const LINK_PLATFORMS = [
  { value: 'github', label: 'GitHub' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'other', label: 'Other' },
];

const PROFICIENCY = ['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Native'];

const emptyProfile = { name: '', email: '', phone: '', location: '', bio: '' };
const emptyAcademic = { college: '', branch: '', cgpa: '', graduationYear: '', semester: '', backlogs: '' };
const emptyExperience = { company: '', role: '', description: '', startDate: '', endDate: '', isCurrent: false, technologies: [] };
const emptyProject = { title: '', description: '', technologies: [], githubLink: '', liveLink: '', startDate: '', endDate: '', isOngoing: false, images: [] };
const emptyCertificate = { name: '', issuer: '', issueDate: '', credentialId: '', credentialUrl: '' };
const emptyCodingProfile = { platform: 'leetcode', profileUrl: '', username: '', rating: '', problemsSolved: '', ranking: '', badges: '' };
const emptyLink = { title: '', url: '', platform: 'github' };
const emptyLanguage = { name: '', proficiency: 'Intermediate' };

export default function Portfolio() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(emptyProfile);
  const [academic, setAcademic] = useState(emptyAcademic);
  const [experiences, setExperiences] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [codingProfiles, setCodingProfiles] = useState([]);
  const [links, setLinks] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [resumeData, setResumeData] = useState(null);

  const [editProfile, setEditProfile] = useState(false);
  const [editAcademic, setEditAcademic] = useState(false);
  const [profileDraft, setProfileDraft] = useState(emptyProfile);
  const [academicDraft, setAcademicDraft] = useState(emptyAcademic);

  const [showExpModal, setShowExpModal] = useState(false);
  const [showProjModal, setShowProjModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showCodingModal, setShowCodingModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);

  const [editingItem, setEditingItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [profileRes, academicRes, projRes, certRes, codingRes, portRes, aiRes] = await Promise.allSettled([
        apiRequest('/settings/profile'),
        apiRequest('/academic'),
        apiRequest('/projects'),
        apiRequest('/certificates'),
        apiRequest('/coding-profiles'),
        apiRequest('/portfolio'),
        apiRequest('/ai/history'),
      ]);

      if (profileRes.status === 'fulfilled') {
        const d = profileRes.value?.data || profileRes.value;
        setProfile({ name: d.name || '', email: d.email || '', phone: d.phone || '', location: d.location || '', bio: d.bio || '' });
      }
      if (academicRes.status === 'fulfilled') {
        const d = academicRes.value?.data || academicRes.value;
        setAcademic({ college: d.college || '', branch: d.branch || '', cgpa: d.cgpa || '', graduationYear: d.graduationYear || '', semester: d.semester || '', backlogs: d.backlogs || '' });
      }
      if (projRes.status === 'fulfilled') setProjects(Array.isArray(projRes.value?.data || projRes.value) ? (projRes.value?.data || projRes.value) : []);
      if (certRes.status === 'fulfilled') setCertificates(Array.isArray(certRes.value?.data || certRes.value) ? (certRes.value?.data || certRes.value) : []);
      if (codingRes.status === 'fulfilled') setCodingProfiles(Array.isArray(codingRes.value?.data || codingRes.value) ? (codingRes.value?.data || codingRes.value) : []);
      if (portRes.status === 'fulfilled') {
        const d = portRes.value?.data || portRes.value;
        if (d?.experiences) setExperiences(d.experiences);
        if (d?.links) setLinks(d.links);
        if (d?.languages) setLanguages(d.languages);
        if (d?.experience) setExperiences(d.experience);
      }
      if (aiRes.status === 'fulfilled') {
        const d = aiRes.value?.data || aiRes.value;
        if (Array.isArray(d) && d.length > 0) setResumeData(d[0]);
        else if (d?.history?.length > 0) setResumeData(d.history[0]);
      }
    } catch (e) {
      console.error('Load failed', e);
    } finally {
      setLoading(false);
    }
  };

  const completionPercentage = (() => {
    let filled = 0, total = 8;
    if (profile.name && profile.email) filled++;
    if (resumeData) filled++;
    if (academic.college) filled++;
    if (experiences.length > 0) filled++;
    if (projects.length > 0) filled++;
    if (certificates.length > 0) filled++;
    if (codingProfiles.length > 0) filled++;
    if (links.length > 0) filled++;
    return Math.round((filled / total) * 100);
  })();

  const saveProfile = async () => {
    setSaving(true);
    try {
      await apiRequest('/settings/profile', 'PUT', profileDraft);
      setProfile(profileDraft);
      setEditProfile(false);
    } catch (e) { alert('Failed to save profile: ' + e.message); }
    finally { setSaving(false); }
  };

  const saveAcademic = async () => {
    setSaving(true);
    try {
      await apiRequest('/academic', 'PUT', academicDraft);
      setAcademic(academicDraft);
      setEditAcademic(false);
    } catch (e) { alert('Failed to save academic: ' + e.message); }
    finally { setSaving(false); }
  };

  const handleCrud = async (endpoint, method, body, setter, list) => {
    try {
      const res = await apiRequest(endpoint, method, body);
      if (method === 'DELETE') setter(list.filter(i => i._id !== body));
      else if (method === 'POST') setter([...list, res?.data || res]);
      else {
        const updated = res?.data || res;
        setter(list.map(i => (i._id === updated._id ? updated : i)));
      }
      return true;
    } catch (e) { alert(e.message); return false; }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { endpoint, id, setter, list } = confirmDelete;
    await handleCrud(endpoint, 'DELETE', id, setter, list);
    setConfirmDelete(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BarChart3 size={28} className="text-blue-600" />
          My Portfolio
        </h1>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <CheckCircle size={16} className={completionPercentage >= 80 ? 'text-green-500' : 'text-yellow-500'} />
          Profile {completionPercentage >= 80 ? 'complete' : 'in progress'}
        </div>
      </div>

      {/* Profile Header */}
      <Section title="Profile" icon={User}>
        <div className="flex flex-col md:flex-row gap-6 pt-4">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
              {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
            </div>
          </div>
          <div className="flex-1 space-y-3">
            {!editProfile ? (
              <>
                <h3 className="text-xl font-bold text-gray-800">{profile.name || 'No name set'}</h3>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500">
                  {profile.email && <span className="flex items-center gap-1"><Mail size={14} /> {profile.email}</span>}
                  {profile.phone && <span className="flex items-center gap-1"><Phone size={14} /> {profile.phone}</span>}
                  {profile.location && <span className="flex items-center gap-1"><MapPin size={14} /> {profile.location}</span>}
                </div>
                {profile.bio && <p className="text-gray-600 text-sm leading-relaxed">{profile.bio}</p>}
                <button onClick={() => { setProfileDraft(profile); setEditProfile(true); }}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2">
                  <Pencil size={14} /> Edit profile
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FieldGroup label="Name">
                    <Input value={profileDraft.name} onChange={e => setProfileDraft({ ...profileDraft, name: e.target.value })} />
                  </FieldGroup>
                  <FieldGroup label="Email">
                    <Input type="email" value={profileDraft.email} onChange={e => setProfileDraft({ ...profileDraft, email: e.target.value })} />
                  </FieldGroup>
                  <FieldGroup label="Phone">
                    <Input value={profileDraft.phone} onChange={e => setProfileDraft({ ...profileDraft, phone: e.target.value })} />
                  </FieldGroup>
                  <FieldGroup label="Location">
                    <Input value={profileDraft.location} onChange={e => setProfileDraft({ ...profileDraft, location: e.target.value })} />
                  </FieldGroup>
                </div>
                <FieldGroup label="Bio">
                  <Textarea rows={3} value={profileDraft.bio} onChange={e => setProfileDraft({ ...profileDraft, bio: e.target.value })} />
                </FieldGroup>
                <div className="flex gap-2">
                  <button onClick={saveProfile} disabled={saving} className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                  </button>
                  <button onClick={() => setEditProfile(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Completion */}
      <Section title="Profile Completion" icon={BarChart3}>
        <div className="pt-4">
          <ProgressBar percentage={completionPercentage} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Profile', done: !!(profile.name && profile.email) },
              { label: 'Resume', done: !!resumeData },
              { label: 'Academic', done: !!academic.college },
              { label: 'Experience', done: experiences.length > 0 },
              { label: 'Projects', done: projects.length > 0 },
              { label: 'Certificates', done: certificates.length > 0 },
              { label: 'Coding', done: codingProfiles.length > 0 },
              { label: 'Links', done: links.length > 0 },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${item.done ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                {item.done ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Resume Summary */}
      <Section title="Resume Summary" icon={Briefcase}>
        {resumeData ? (
          <div className="pt-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${resumeData.atsScore >= 70 ? 'text-green-600' : resumeData.atsScore >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {resumeData.atsScore ?? '—'}
                </div>
                <div className="text-xs text-gray-500">ATS Score</div>
              </div>
              {resumeData.extractedSkills?.length > 0 && (
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Extracted Skills</div>
                  <div className="flex flex-wrap gap-1">
                    {resumeData.extractedSkills.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm pt-4">No resume uploaded yet. Upload a resume to see ATS score and extracted skills.</p>
        )}
      </Section>

      {/* Academic Profile */}
      <Section title="Academic Profile" icon={GraduationCap}>
        <div className="pt-4">
          {!editAcademic ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoItem label="College" value={academic.college} />
                <InfoItem label="Branch" value={academic.branch} />
                <InfoItem label="CGPA" value={academic.cgpa} />
                <InfoItem label="Graduation Year" value={academic.graduationYear} />
                <InfoItem label="Semester" value={academic.semester} />
                <InfoItem label="Backlogs" value={academic.backlogs ?? 'None'} />
              </div>
              <button onClick={() => { setAcademicDraft(academic); setEditAcademic(true); }}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-3">
                <Pencil size={14} /> Edit academic info
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FieldGroup label="College">
                  <Input value={academicDraft.college} onChange={e => setAcademicDraft({ ...academicDraft, college: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Branch">
                  <Input value={academicDraft.branch} onChange={e => setAcademicDraft({ ...academicDraft, branch: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="CGPA">
                  <Input type="number" step="0.01" min="0" max="10" value={academicDraft.cgpa} onChange={e => setAcademicDraft({ ...academicDraft, cgpa: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Graduation Year">
                  <Input type="number" value={academicDraft.graduationYear} onChange={e => setAcademicDraft({ ...academicDraft, graduationYear: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Semester">
                  <Input value={academicDraft.semester} onChange={e => setAcademicDraft({ ...academicDraft, semester: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Backlogs">
                  <Input value={academicDraft.backlogs} onChange={e => setAcademicDraft({ ...academicDraft, backlogs: e.target.value })} placeholder="0" />
                </FieldGroup>
              </div>
              <div className="flex gap-2">
                <button onClick={saveAcademic} disabled={saving} className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                </button>
                <button onClick={() => setEditAcademic(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Experience */}
      <Section title="Experience" icon={Briefcase} count={experiences.length}>
        <div className="pt-4 space-y-4">
          {experiences.length === 0 ? (
            <EmptyState icon={Briefcase} message="No experiences added yet" onAdd={() => { setEditingItem(null); setShowExpModal(true); }} />
          ) : (
            <>
              {experiences.map(exp => (
                <div key={exp._id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">{exp.role}</h4>
                      <p className="text-sm text-blue-600">{exp.company}</p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Calendar size={12} />
                        {exp.startDate ? new Date(exp.startDate).toLocaleDateString() : '—'} – {exp.isCurrent ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString() : '—'}
                      </p>
                      {exp.description && <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{exp.description}</p>}
                      {exp.technologies?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {exp.technologies.map((t, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingItem(exp); setShowExpModal(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setConfirmDelete({ endpoint: '/portfolio', id: exp._id, setter: setExperiences, list: experiences })} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => { setEditingItem(null); setShowExpModal(true); }} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"><Plus size={14} /> Add experience</button>
            </>
          )}
        </div>
      </Section>

      {/* Projects */}
      <Section title="Projects" icon={FolderGit2} count={projects.length}>
        <div className="pt-4 space-y-4">
          {projects.length === 0 ? (
            <EmptyState icon={FolderGit2} message="No projects added yet" onAdd={() => { setEditingItem(null); setShowProjModal(true); }} />
          ) : (
            <>
              {projects.map(proj => (
                <div key={proj._id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{proj.title}</h4>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Calendar size={12} />
                        {proj.startDate ? new Date(proj.startDate).toLocaleDateString() : '—'} – {proj.isOngoing ? 'Ongoing' : proj.endDate ? new Date(proj.endDate).toLocaleDateString() : '—'}
                      </p>
                      {proj.description && <p className="text-sm text-gray-600 mt-2">{proj.description}</p>}
                      {proj.technologies?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {proj.technologies.map((t, i) => (
                            <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full">{t}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-3 mt-2">
                        {proj.githubLink && <a href={proj.githubLink} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"><Globe size={12} /> GitHub</a>}
                        {proj.liveLink && <a href={proj.liveLink} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1"><ExternalLink size={12} /> Live</a>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingItem(proj); setShowProjModal(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setConfirmDelete({ endpoint: '/portfolio', id: proj._id, setter: setProjects, list: projects })} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => { setEditingItem(null); setShowProjModal(true); }} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"><Plus size={14} /> Add project</button>
            </>
          )}
        </div>
      </Section>

      {/* Certificates */}
      <Section title="Certificates" icon={Award} count={certificates.length}>
        <div className="pt-4 space-y-4">
          {certificates.length === 0 ? (
            <EmptyState icon={Award} message="No certificates added yet" onAdd={() => { setEditingItem(null); setShowCertModal(true); }} />
          ) : (
            <>
              {certificates.map(cert => (
                <div key={cert._id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">{cert.name}</h4>
                      <p className="text-sm text-blue-600">{cert.issuer}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Issued: {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : '—'}
                        {cert.credentialId && ` • ID: ${cert.credentialId}`}
                      </p>
                      {cert.credentialUrl && (
                        <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 mt-1"><ExternalLink size={12} /> View credential</a>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingItem(cert); setShowCertModal(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setConfirmDelete({ endpoint: '/portfolio', id: cert._id, setter: setCertificates, list: certificates })} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => { setEditingItem(null); setShowCertModal(true); }} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"><Plus size={14} /> Add certificate</button>
            </>
          )}
        </div>
      </Section>

      {/* Coding Profiles */}
      <Section title="Coding Profiles" icon={Code2} count={codingProfiles.length}>
        <div className="pt-4 space-y-4">
          {codingProfiles.length === 0 ? (
            <EmptyState icon={Code2} message="No coding profiles added yet" onAdd={() => { setEditingItem(null); setShowCodingModal(true); }} />
          ) : (
            <>
              {codingProfiles.map(cp => (
                <div key={cp._id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        {PLATFORMS.find(p => p.value === cp.platform)?.label || cp.platform}
                        {cp.username && <span className="text-sm font-normal text-gray-500">({cp.username})</span>}
                      </h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-2">
                        {cp.rating && <span>Rating: {cp.rating}</span>}
                        {cp.problemsSolved && <span>Problems: {cp.problemsSolved}</span>}
                        {cp.ranking && <span>Rank: {cp.ranking}</span>}
                      </div>
                      {cp.badges && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Trophy size={12} /> {cp.badges}</p>
                      )}
                      {cp.profileUrl && (
                        <a href={cp.profileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 mt-1"><ExternalLink size={12} /> View profile</a>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingItem(cp); setShowCodingModal(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setConfirmDelete({ endpoint: '/portfolio', id: cp._id, setter: setCodingProfiles, list: codingProfiles })} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => { setEditingItem(null); setShowCodingModal(true); }} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"><Plus size={14} /> Add coding profile</button>
            </>
          )}
        </div>
      </Section>

      {/* Portfolio Links */}
      <Section title="Portfolio Links" icon={LinkIcon} count={links.length}>
        <div className="pt-4 space-y-4">
          {links.length === 0 ? (
            <EmptyState icon={LinkIcon} message="No portfolio links added yet" onAdd={() => { setEditingItem(null); setShowLinkModal(true); }} />
          ) : (
            <>
              {links.map(link => (
                <div key={link._id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">{link.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{LINK_PLATFORMS.find(p => p.value === link.platform)?.label || link.platform}</p>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"><ExternalLink size={12} /> {link.url}</a>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingItem(link); setShowLinkModal(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setConfirmDelete({ endpoint: '/portfolio', id: link._id, setter: setLinks, list: links })} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => { setEditingItem(null); setShowLinkModal(true); }} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"><Plus size={14} /> Add link</button>
            </>
          )}
        </div>
      </Section>

      {/* Languages */}
      <Section title="Languages" icon={Languages} count={languages.length}>
        <div className="pt-4 space-y-4">
          {languages.length === 0 ? (
            <EmptyState icon={Languages} message="No languages added yet" onAdd={() => { setEditingItem(null); setShowLangModal(true); }} />
          ) : (
            <>
              {languages.map(lang => (
                <div key={lang._id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-800">{lang.name}</h4>
                      <p className="text-sm text-gray-500">{lang.proficiency}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingItem(lang); setShowLangModal(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setConfirmDelete({ endpoint: '/portfolio', id: lang._id, setter: setLanguages, list: languages })} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => { setEditingItem(null); setShowLangModal(true); }} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"><Plus size={14} /> Add language</button>
            </>
          )}
        </div>
      </Section>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete item"
        message="Are you sure you want to delete this item? This action cannot be undone."
      />

      {/* Experience Modal */}
      <ExperienceModal open={showExpModal} onClose={() => { setShowExpModal(false); setEditingItem(null); }} item={editingItem} onSave={async (data) => {
        const endpoint = editingItem ? `/portfolio/${editingItem._id}` : '/portfolio';
        const method = editingItem ? 'PUT' : 'POST';
        const ok = await handleCrud(endpoint, method, { ...data, type: 'experience' }, setExperiences, experiences);
        if (ok) { setShowExpModal(false); setEditingItem(null); }
      }} />

      {/* Project Modal */}
      <ProjectModal open={showProjModal} onClose={() => { setShowProjModal(false); setEditingItem(null); }} item={editingItem} onSave={async (data) => {
        const endpoint = editingItem ? `/portfolio/${editingItem._id}` : '/portfolio';
        const method = editingItem ? 'PUT' : 'POST';
        const ok = await handleCrud(endpoint, method, { ...data, type: 'project' }, setProjects, projects);
        if (ok) { setShowProjModal(false); setEditingItem(null); }
      }} />

      {/* Certificate Modal */}
      <CertificateModal open={showCertModal} onClose={() => { setShowCertModal(false); setEditingItem(null); }} item={editingItem} onSave={async (data) => {
        const endpoint = editingItem ? `/portfolio/${editingItem._id}` : '/portfolio';
        const method = editingItem ? 'PUT' : 'POST';
        const ok = await handleCrud(endpoint, method, { ...data, type: 'certificate' }, setCertificates, certificates);
        if (ok) { setShowCertModal(false); setEditingItem(null); }
      }} />

      {/* Coding Profile Modal */}
      <CodingProfileModal open={showCodingModal} onClose={() => { setShowCodingModal(false); setEditingItem(null); }} item={editingItem} onSave={async (data) => {
        const endpoint = editingItem ? `/portfolio/${editingItem._id}` : '/portfolio';
        const method = editingItem ? 'PUT' : 'POST';
        const ok = await handleCrud(endpoint, method, { ...data, type: 'codingProfile' }, setCodingProfiles, codingProfiles);
        if (ok) { setShowCodingModal(false); setEditingItem(null); }
      }} />

      {/* Link Modal */}
      <LinkModal open={showLinkModal} onClose={() => { setShowLinkModal(false); setEditingItem(null); }} item={editingItem} onSave={async (data) => {
        const endpoint = editingItem ? `/portfolio/${editingItem._id}` : '/portfolio';
        const method = editingItem ? 'PUT' : 'POST';
        const ok = await handleCrud(endpoint, method, { ...data, type: 'link' }, setLinks, links);
        if (ok) { setShowLinkModal(false); setEditingItem(null); }
      }} />

      {/* Language Modal */}
      <LanguageModal open={showLangModal} onClose={() => { setShowLangModal(false); setEditingItem(null); }} item={editingItem} onSave={async (data) => {
        const endpoint = editingItem ? `/portfolio/${editingItem._id}` : '/portfolio';
        const method = editingItem ? 'PUT' : 'POST';
        const ok = await handleCrud(endpoint, method, { ...data, type: 'language' }, setLanguages, languages);
        if (ok) { setShowLangModal(false); setEditingItem(null); }
      }} />
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
    </div>
  );
}

function ExperienceModal({ open, onClose, item, onSave }) {
  const [form, setForm] = useState({ ...emptyExperience });
  useEffect(() => { if (item) setForm({ ...emptyExperience, ...item }); else setForm({ ...emptyExperience }); }, [item, open]);
  const handleSubmit = () => { onSave(form); };
  return (
    <Modal open={open} onClose={onClose} title={item ? 'Edit Experience' : 'Add Experience'}>
      <div className="space-y-3">
        <FieldGroup label="Company">
          <Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Company name" />
        </FieldGroup>
        <FieldGroup label="Role">
          <Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Job title" />
        </FieldGroup>
        <FieldGroup label="Description">
          <Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe your role..." />
        </FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Start Date">
            <Input type="date" value={form.startDate?.slice(0, 10) || ''} onChange={e => setForm({ ...form, startDate: e.target.value })} />
          </FieldGroup>
          <FieldGroup label="End Date">
            <Input type="date" value={form.endDate?.slice(0, 10) || ''} onChange={e => setForm({ ...form, endDate: e.target.value })} disabled={form.isCurrent} />
          </FieldGroup>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.isCurrent} onChange={e => setForm({ ...form, isCurrent: e.target.checked })} className="rounded border-gray-300" />
          Currently working here
        </label>
        <FieldGroup label="Technologies">
          <TagInput tags={form.technologies || []} onChange={tags => setForm({ ...form, technologies: tags })} placeholder="e.g. React, Node.js" />
        </FieldGroup>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Save</button>
        </div>
      </div>
    </Modal>
  );
}

function ProjectModal({ open, onClose, item, onSave }) {
  const [form, setForm] = useState({ ...emptyProject });
  useEffect(() => { if (item) setForm({ ...emptyProject, ...item }); else setForm({ ...emptyProject }); }, [item, open]);
  const handleSubmit = () => { onSave(form); };
  return (
    <Modal open={open} onClose={onClose} title={item ? 'Edit Project' : 'Add Project'}>
      <div className="space-y-3">
        <FieldGroup label="Title">
          <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Project name" />
        </FieldGroup>
        <FieldGroup label="Description">
          <Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the project..." />
        </FieldGroup>
        <FieldGroup label="Technologies">
          <TagInput tags={form.technologies || []} onChange={tags => setForm({ ...form, technologies: tags })} placeholder="e.g. React, Python" />
        </FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="GitHub Link">
            <Input value={form.githubLink} onChange={e => setForm({ ...form, githubLink: e.target.value })} placeholder="https://github.com/..." />
          </FieldGroup>
          <FieldGroup label="Live Link">
            <Input value={form.liveLink} onChange={e => setForm({ ...form, liveLink: e.target.value })} placeholder="https://..." />
          </FieldGroup>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Start Date">
            <Input type="date" value={form.startDate?.slice(0, 10) || ''} onChange={e => setForm({ ...form, startDate: e.target.value })} />
          </FieldGroup>
          <FieldGroup label="End Date">
            <Input type="date" value={form.endDate?.slice(0, 10) || ''} onChange={e => setForm({ ...form, endDate: e.target.value })} disabled={form.isOngoing} />
          </FieldGroup>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.isOngoing} onChange={e => setForm({ ...form, isOngoing: e.target.checked })} className="rounded border-gray-300" />
          Ongoing project
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Save</button>
        </div>
      </div>
    </Modal>
  );
}

function CertificateModal({ open, onClose, item, onSave }) {
  const [form, setForm] = useState({ ...emptyCertificate });
  useEffect(() => { if (item) setForm({ ...emptyCertificate, ...item }); else setForm({ ...emptyCertificate }); }, [item, open]);
  return (
    <Modal open={open} onClose={onClose} title={item ? 'Edit Certificate' : 'Add Certificate'}>
      <div className="space-y-3">
        <FieldGroup label="Name">
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Certificate name" />
        </FieldGroup>
        <FieldGroup label="Issuer">
          <Input value={form.issuer} onChange={e => setForm({ ...form, issuer: e.target.value })} placeholder="Issuing organization" />
        </FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Issue Date">
            <Input type="date" value={form.issueDate?.slice(0, 10) || ''} onChange={e => setForm({ ...form, issueDate: e.target.value })} />
          </FieldGroup>
          <FieldGroup label="Credential ID">
            <Input value={form.credentialId} onChange={e => setForm({ ...form, credentialId: e.target.value })} placeholder="Optional" />
          </FieldGroup>
        </div>
        <FieldGroup label="Credential URL">
          <Input value={form.credentialUrl} onChange={e => setForm({ ...form, credentialUrl: e.target.value })} placeholder="https://..." />
        </FieldGroup>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Save</button>
        </div>
      </div>
    </Modal>
  );
}

function CodingProfileModal({ open, onClose, item, onSave }) {
  const [form, setForm] = useState({ ...emptyCodingProfile });
  useEffect(() => { if (item) setForm({ ...emptyCodingProfile, ...item }); else setForm({ ...emptyCodingProfile }); }, [item, open]);
  return (
    <Modal open={open} onClose={onClose} title={item ? 'Edit Coding Profile' : 'Add Coding Profile'}>
      <div className="space-y-3">
        <FieldGroup label="Platform">
          <Select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
            {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </Select>
        </FieldGroup>
        <FieldGroup label="Username">
          <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Your username" />
        </FieldGroup>
        <FieldGroup label="Profile URL">
          <Input value={form.profileUrl} onChange={e => setForm({ ...form, profileUrl: e.target.value })} placeholder="https://..." />
        </FieldGroup>
        <div className="grid grid-cols-3 gap-3">
          <FieldGroup label="Rating">
            <Input value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} placeholder="—" />
          </FieldGroup>
          <FieldGroup label="Problems Solved">
            <Input value={form.problemsSolved} onChange={e => setForm({ ...form, problemsSolved: e.target.value })} placeholder="—" />
          </FieldGroup>
          <FieldGroup label="Ranking">
            <Input value={form.ranking} onChange={e => setForm({ ...form, ranking: e.target.value })} placeholder="—" />
          </FieldGroup>
        </div>
        <FieldGroup label="Badges">
          <Input value={form.badges} onChange={e => setForm({ ...form, badges: e.target.value })} placeholder="Gold, Silver..." />
        </FieldGroup>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Save</button>
        </div>
      </div>
    </Modal>
  );
}

function LinkModal({ open, onClose, item, onSave }) {
  const [form, setForm] = useState({ ...emptyLink });
  useEffect(() => { if (item) setForm({ ...emptyLink, ...item }); else setForm({ ...emptyLink }); }, [item, open]);
  return (
    <Modal open={open} onClose={onClose} title={item ? 'Edit Link' : 'Add Link'}>
      <div className="space-y-3">
        <FieldGroup label="Title">
          <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. My Portfolio" />
        </FieldGroup>
        <FieldGroup label="URL">
          <Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
        </FieldGroup>
        <FieldGroup label="Platform">
          <Select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
            {LINK_PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </Select>
        </FieldGroup>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Save</button>
        </div>
      </div>
    </Modal>
  );
}

function LanguageModal({ open, onClose, item, onSave }) {
  const [form, setForm] = useState({ ...emptyLanguage });
  useEffect(() => { if (item) setForm({ ...emptyLanguage, ...item }); else setForm({ ...emptyLanguage }); }, [item, open]);
  return (
    <Modal open={open} onClose={onClose} title={item ? 'Edit Language' : 'Add Language'}>
      <div className="space-y-3">
        <FieldGroup label="Language">
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. English, Spanish" />
        </FieldGroup>
        <FieldGroup label="Proficiency">
          <Select value={form.proficiency} onChange={e => setForm({ ...form, proficiency: e.target.value })}>
            {PROFICIENCY.map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
        </FieldGroup>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Save</button>
        </div>
      </div>
    </Modal>
  );
}
