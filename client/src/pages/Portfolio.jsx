import { useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  Award,
  Briefcase,
  Code2,
  ExternalLink,
  FileText,
  FolderKanban,
  GraduationCap,
  Globe,
  Link as LinkIcon,
  Plus,
  Pencil,
  Trash2,
  UserCircle2,
  X,
  Search,
  Filter,
  Star,
} from 'lucide-react'
import { AuthContext } from '../context/authContext.js'
import { getAcademicProfile } from '../services/academicService'
import portfolioService from '../services/portfolio.service'
import projectService from '../services/projectService'
import codingProfileService from '../services/codingProfileService'
import { normalizeArray } from '../utils/apiNormalizer'
import ProjectCard from '../components/ProjectCard'
import ProjectForm from '../components/ProjectForm'
import ProjectScoreCard from '../components/ProjectScoreCard'
import PortfolioStats from '../components/PortfolioStats'
import TechnologyBadge from '../components/TechnologyBadge'
import AcademicForm from '../components/AcademicForm'
import AcademicCard from '../components/AcademicCard'
import { createAcademicProfile, updateAcademicProfile } from '../services/academicService'

const PLATFORMS = ['GitHub', 'LinkedIn', 'Portfolio', 'Other']
const PROFICIENCY_LEVELS = ['Basic', 'Conversational', 'Professional', 'Native']
const CERT_CATEGORIES = ['Technology', 'Cloud', 'Data Science', 'Project Management', 'Security', 'AI/ML', 'DevOps', 'Other']
const CODING_PLATFORMS = ['LeetCode', 'HackerRank', 'CodeChef', 'Codeforces', 'GeeksforGeeks']
const PROJECT_CATEGORIES = ['Web Development', 'Mobile Development', 'AI/ML', 'Data Science', 'DevOps', 'Backend', 'Frontend', 'Full Stack', 'Other']

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl animate-fade-in max-h-[80vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function EmptyItem({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-400">
      <Icon className="h-4 w-4" />
      {text}
    </div>
  )
}

function CandidatePortfolio({ section }) {
  const { user } = useContext(AuthContext)
  const [resumes, setResumes] = useState([])
  const [academic, setAcademic] = useState(null)
  const [projects, setProjects] = useState([])
  const [certificates, setCertificates] = useState([])
  const [codingProfiles, setCodingProfiles] = useState([])
  const [unifiedCodingProfile, setUnifiedCodingProfile] = useState(null)
  const [experiences, setExperiences] = useState([])
  const [languages, setLanguages] = useState([])
  const [links, setLinks] = useState([])
  const [completion, setCompletion] = useState(null)
  const [portfolioStats, setPortfolioStats] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [scoringProjectId, setScoringProjectId] = useState(null)
  const [editingAcademic, setEditingAcademic] = useState(false)
  const [academicLoading, setAcademicLoading] = useState(false)

  const [modal, setModal] = useState(null)
  const [formData, setFormData] = useState({})
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    async function fetchData() {
      const token = localStorage.getItem('token')
      const [resumeResponse, academicResponse] = await Promise.allSettled([
        axios.get(`${import.meta.env.VITE_API_URL}/api/ai/history`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        getAcademicProfile(),
      ])
      if (resumeResponse.status === 'fulfilled') setResumes(normalizeArray(resumeResponse.value.data))
      if (academicResponse.status === 'fulfilled') setAcademic(academicResponse.value || null)

      try { setProjects(normalizeArray(await portfolioService.getProjects())) } catch {}
      try { setCertificates(normalizeArray(await portfolioService.getCertificates())) } catch {}
      try { setCodingProfiles(normalizeArray(await portfolioService.getCodingProfiles())) } catch {}
      try { setUnifiedCodingProfile(await codingProfileService.getProfile()) } catch {}
      try { setExperiences(normalizeArray(await portfolioService.getExperience())) } catch {}
      try { setLanguages(normalizeArray(await portfolioService.getLanguages())) } catch {}
      try { setLinks(normalizeArray(await portfolioService.getLinks())) } catch {}
      try { setCompletion(await portfolioService.getCompletion()) } catch {}
      try { setPortfolioStats(await projectService.getPortfolioStats()) } catch {}
    }
    fetchData()
  }, [])

  const openModal = (type, data = null) => {
    setModal(type)
    setEditingId(data?._id || null)
    setFormData(data || {})
  }

  const closeModal = () => {
    setModal(null)
    setEditingId(null)
    setFormData({})
  }

  const handleSave = async (type, createFn, updateFn, listSetter) => {
    try {
      if (editingId) {
        const updated = await updateFn(editingId, formData)
        listSetter((prev) => prev.map((item) => (item._id === editingId ? updated : item)))
      } else {
        const created = await createFn(formData)
        listSetter((prev) => [created, ...prev])
      }
      closeModal()
    } catch (err) {
      console.error('Save failed:', err)
    }
  }

  const handleDelete = async (type, deleteFn, id, listSetter) => {
    try {
      await deleteFn(id)
      listSetter((prev) => prev.filter((item) => item._id !== id))
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const handleProjectSave = async (data) => {
    if (editingProject) {
      const updated = await projectService.updateProject(editingProject._id, data)
      setProjects((prev) => prev.map((p) => (p._id === editingProject._id ? updated : p)))
    } else {
      const created = await projectService.createProject(data)
      setProjects((prev) => [created, ...prev])
    }
    setShowProjectForm(false)
    setEditingProject(null)
    try { setPortfolioStats(await projectService.getPortfolioStats()) } catch {}
  }

  const handleProjectDelete = async (id) => {
    try {
      await projectService.deleteProject(id)
      setProjects((prev) => prev.filter((p) => p._id !== id))
      if (selectedProject?._id === id) setSelectedProject(null)
      try { setPortfolioStats(await projectService.getPortfolioStats()) } catch {}
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const handleProjectScore = async (projectId) => {
    setScoringProjectId(projectId)
    try {
      const updated = await projectService.scoreProject(projectId)
      setProjects((prev) => prev.map((p) => (p._id === projectId ? updated : p)))
      if (selectedProject?._id === projectId) setSelectedProject(updated)
      try { setPortfolioStats(await projectService.getPortfolioStats()) } catch {}
    } catch (err) {
      console.error('Score failed:', err)
    } finally {
      setScoringProjectId(null)
    }
  }

  const handleAcademicSubmit = async (data) => {
    setAcademicLoading(true)
    try {
      if (academic) {
        const updated = await updateAcademicProfile(data)
        setAcademic(updated)
      } else {
        const created = await createAcademicProfile(data)
        setAcademic(created)
      }
      setEditingAcademic(false)
    } catch (err) {
      console.error('Academic save failed:', err)
    } finally {
      setAcademicLoading(false)
    }
  }

  const completionPercent = completion?.completion || 0

  const sections = useMemo(() => [
    {
      id: 'overview',
      title: 'Profile Summary',
      icon: UserCircle2,
      body: (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</p>
              <p className="mt-2 text-sm font-bold text-slate-800">{user?.name || 'Candidate'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
              <p className="mt-2 text-sm font-bold text-slate-800">{user?.email || 'Not available'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resumes</p>
              <p className="mt-2 text-sm font-bold text-slate-800">{resumes.length}</p>
            </div>
          </div>
          {completionPercent > 0 && (
            <div className="rounded-2xl bg-blue-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700">Portfolio Completion</p>
                <span className="text-sm font-bold text-blue-600">{completionPercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-blue-100">
                <div className="h-2 rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${completionPercent}%` }} />
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'resume',
      title: 'Resume',
      icon: FileText,
      body: resumes.length > 0 ? (
        <div className="space-y-3">
          {resumes.slice(0, 5).map((resume) => (
            <div key={resume._id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
              <div>
                <p className="text-sm font-bold text-slate-800">{resume.filename || resume.fileName || 'Resume'}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {resume.createdAt ? new Date(resume.createdAt).toLocaleDateString() : 'Date unavailable'}
                </p>
              </div>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                ATS {resume.atsScore || 0}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No resumes uploaded yet.</p>
      ),
    },
    {
      id: 'academic',
      title: 'Academic',
      icon: GraduationCap,
      action: (
        <button type="button" onClick={() => setEditingAcademic(!editingAcademic)} className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
          {editingAcademic ? 'Cancel' : (academic ? 'Edit' : 'Add Academic Profile')}
        </button>
      ),
      body: editingAcademic ? (
        <AcademicForm
          initialData={academic || {}}
          onSubmit={handleAcademicSubmit}
          loading={academicLoading}
        />
      ) : academic ? (
        <AcademicCard profile={academic} onEdit={() => setEditingAcademic(true)} aiScore={null} />
      ) : (
        <EmptyItem icon={GraduationCap} text="No academic profile added yet. Click 'Add Academic Profile' to get started." />
      ),
    },
    {
      id: 'projects',
      title: 'Projects',
      icon: FolderKanban,
      action: (
        <button type="button" onClick={() => { setEditingProject(null); setShowProjectForm(true) }} className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
          <Plus className="h-3 w-3" /> Add Project
        </button>
      ),
      body: projects.length > 0 ? (
        <div className="space-y-4">
          <PortfolioStats stats={portfolioStats} loading={!portfolioStats} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div key={project._id} className="relative">
                <ProjectCard
                  project={project}
                  onSelect={(p) => setSelectedProject(p)}
                  onScore={() => handleProjectScore(project._id)}
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setEditingProject(project); setShowProjectForm(true) }}
                    className="rounded-lg bg-white/90 p-1.5 text-slate-400 shadow-sm hover:bg-slate-100 hover:text-slate-600"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); if (confirm('Delete this project?')) handleProjectDelete(project._id) }}
                    className="rounded-lg bg-white/90 p-1.5 text-slate-400 shadow-sm hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyItem icon={FolderKanban} text="No projects added yet. Click 'Add Project' to showcase your work." />
      ),
    },
    {
      id: 'certificates',
      title: 'Certificates',
      icon: Award,
      action: (
        <button type="button" onClick={() => openModal('certificate')} className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
          <Plus className="h-3 w-3" /> Add
        </button>
      ),
      body: certificates.length > 0 ? (
        <div className="space-y-3">
          {certificates.map((cert) => (
            <div key={cert._id} className="flex items-start justify-between rounded-2xl bg-slate-50 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-800">{cert.name}</p>
                  {cert.category && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">{cert.category}</span>
                  )}
                  {cert.verificationStatus && cert.verificationStatus !== 'unverified' && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      cert.verificationStatus === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                      cert.verificationStatus === 'pending' ? 'bg-amber-100 text-amber-700' :
                      cert.verificationStatus === 'expired' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{cert.verificationStatus}</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">{cert.issuer}{cert.issueDate ? ` - ${new Date(cert.issueDate).toLocaleDateString()}` : ''}</p>
                {cert.skills && cert.skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {cert.skills.map((skill, i) => (
                      <span key={i} className="rounded-lg bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">{skill}</span>
                    ))}
                  </div>
                )}
                {cert.credentialUrl && (
                  <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[10px] font-semibold text-blue-600 hover:underline">View Credential</a>
                )}
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => openModal('certificate', cert)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200"><Pencil className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => handleDelete('certificate', portfolioService.deleteCertificate, cert._id, setCertificates)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyItem icon={Award} text="No certificates added yet." />
      ),
    },
    {
      id: 'codingProfiles',
      title: 'Coding Profiles',
      icon: Code2,
      action: (
        <button type="button" onClick={() => openModal('codingProfile')} className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
          <Plus className="h-3 w-3" /> Add
        </button>
      ),
      body: (
        <div className="space-y-3">
          {unifiedCodingProfile && (
            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Unified Coding Profile</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">GitHub</p>
                  <p className="text-sm font-bold text-slate-800">{unifiedCodingProfile.githubUsername || 'Not connected'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">LeetCode</p>
                  <p className="text-sm font-bold text-slate-800">{unifiedCodingProfile.leetcodeUsername || 'Not connected'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">HackerRank</p>
                  <p className="text-sm font-bold text-slate-800">{unifiedCodingProfile.hackerrankUsername || 'Not connected'}</p>
                </div>
              </div>
              {unifiedCodingProfile.lastSynced && (
                <p className="mt-2 text-[10px] text-slate-500">
                  Last synced: {new Date(unifiedCodingProfile.lastSynced).toLocaleString()}
                </p>
              )}
            </div>
          )}
          {codingProfiles.length > 0 ? (
            codingProfiles.map((profile) => (
              <div key={profile._id} className="flex items-start justify-between rounded-2xl bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-bold text-slate-800">{profile.platform}</p>
                  <p className="mt-1 text-xs text-slate-500">Username: {profile.username || 'N/A'}</p>
                  {profile.rating && <p className="text-xs text-slate-500">Rating: {profile.rating}</p>}
                  {profile.problemsSolved && <p className="text-xs text-slate-500">Problems Solved: {profile.problemsSolved}</p>}
                  {profile.profileUrl && (
                    <a href={profile.profileUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:underline">
                      <ExternalLink className="h-3 w-3" /> Profile
                    </a>
                  )}
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => openModal('codingProfile', profile)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200"><Pencil className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => handleDelete('codingProfile', portfolioService.deleteCodingProfile, profile._id, setCodingProfiles)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))
          ) : (
            <EmptyItem icon={Code2} text="No coding profiles connected yet." />
          )}
        </div>
      ),
    },
    {
      id: 'experience',
      title: 'Experience',
      icon: Briefcase,
      action: (
        <button type="button" onClick={() => openModal('experience')} className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
          <Plus className="h-3 w-3" /> Add
        </button>
      ),
      body: experiences.length > 0 ? (
        <div className="space-y-3">
          {experiences.map((exp) => (
            <div key={exp._id} className="flex items-start justify-between rounded-2xl bg-slate-50 p-4">
              <div>
                <p className="text-sm font-bold text-slate-800">{exp.role} at {exp.company}</p>
                <p className="mt-1 text-xs text-slate-500">{exp.description}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(exp.startDate).toLocaleDateString()} - {exp.isCurrent ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString() : ''}
                </p>
                {exp.technologies?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {exp.technologies.map((t, i) => (
                      <span key={i} className="rounded-lg bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => openModal('experience', exp)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200"><Pencil className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => handleDelete('experience', portfolioService.deleteExperience, exp._id, setExperiences)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyItem icon={Briefcase} text="No experience added yet." />
      ),
    },
    {
      id: 'languages',
      title: 'Languages',
      icon: Globe,
      action: (
        <button type="button" onClick={() => openModal('language')} className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
          <Plus className="h-3 w-3" /> Add
        </button>
      ),
      body: languages.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {languages.map((lang) => (
            <div key={lang._id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <span className="text-sm font-semibold text-slate-800">{lang.name}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{lang.proficiency}</span>
              <button type="button" onClick={() => handleDelete('language', portfolioService.deleteLanguage, lang._id, setLanguages)} className="ml-1 text-slate-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyItem icon={Globe} text="No languages added yet." />
      ),
    },
    {
      id: 'links',
      title: 'Portfolio Links',
      icon: LinkIcon,
      action: (
        <button type="button" onClick={() => openModal('link')} className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
          <Plus className="h-3 w-3" /> Add
        </button>
      ),
      body: links.length > 0 ? (
        <div className="space-y-2">
          {links.map((link) => (
            <div key={link._id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center gap-3">
                <LinkIcon className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{link.title}</p>
                  <a href={link.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">{link.url}</a>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{link.platform}</span>
                <button type="button" onClick={() => handleDelete('link', portfolioService.deleteLink, link._id, setLinks)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyItem icon={LinkIcon} text="No portfolio links added yet." />
      ),
    },
  ], [academic, resumes, projects, certificates, codingProfiles, unifiedCodingProfile, experiences, languages, links, completionPercent, user, portfolioStats])

  const orderedSections = section && section !== 'overview'
    ? [...sections.filter((item) => item.id === section), ...sections.filter((item) => item.id !== section)]
    : sections

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold text-slate-800">Portfolio</h1>
        <p className="mt-2 text-slate-500">Resume, academic record, projects, certificates, and coding profiles.</p>
      </div>

      {orderedSections.map((item) => {
        const Icon = item.icon
        return (
          <section key={item.id} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">{item.title}</h2>
              </div>
              {item.action}
            </div>
            {item.body}
          </section>
        )
      })}

      {/* Project Form Modal */}
      {showProjectForm && (
        <ProjectForm
          project={editingProject}
          onSave={handleProjectSave}
          onClose={() => { setShowProjectForm(false); setEditingProject(null) }}
        />
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSelectedProject(null)} />
          <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">{selectedProject.title}</h3>
              <button type="button" onClick={() => setSelectedProject(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">{selectedProject.category || 'Other'}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedProject.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {selectedProject.status === 'in-progress' ? 'In Progress' : selectedProject.status}
                </span>
              </div>
              {selectedProject.description && (
                <p className="text-sm text-slate-600">{selectedProject.description}</p>
              )}
              {selectedProject.technologies?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedProject.technologies.map((tech, i) => (
                    <TechnologyBadge key={i} name={tech} size="md" />
                  ))}
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                {selectedProject.duration && (
                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-[10px] text-slate-400">Duration</p>
                    <p className="text-sm font-bold text-slate-800">{selectedProject.duration}</p>
                  </div>
                )}
                {selectedProject.teamSize > 0 && (
                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-[10px] text-slate-400">Team Size</p>
                    <p className="text-sm font-bold text-slate-800">{selectedProject.teamSize}</p>
                  </div>
                )}
                {selectedProject.role && (
                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-[10px] text-slate-400">Role</p>
                    <p className="text-sm font-bold text-slate-800">{selectedProject.role}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {selectedProject.githubUrl && (
                  <a href={selectedProject.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
                    <ExternalLink className="h-4 w-4" /> GitHub
                  </a>
                )}
                {selectedProject.liveDemoUrl && (
                  <a href={selectedProject.liveDemoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-200">
                    <ExternalLink className="h-4 w-4" /> Live Demo
                  </a>
                )}
              </div>
              <ProjectScoreCard
                score={selectedProject.projectScore}
                loading={scoringProjectId === selectedProject._id}
                onScore={() => handleProjectScore(selectedProject._id)}
              />
            </div>
          </div>
        </div>
      )}

      <Modal open={modal === 'certificate'} onClose={closeModal} title={editingId ? 'Edit Certificate' : 'Add Certificate'}>
        <div className="space-y-3">
          <input placeholder="Certificate Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
          <input placeholder="Issuer" value={formData.issuer || ''} onChange={(e) => setFormData({ ...formData, issuer: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
          <select value={formData.category || 'Other'} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400">
            {CERT_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <input type="date" placeholder="Issue Date" value={formData.issueDate ? new Date(formData.issueDate).toISOString().split('T')[0] : ''} onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
          <input type="date" placeholder="Expiry Date" value={formData.expiryDate ? new Date(formData.expiryDate).toISOString().split('T')[0] : ''} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
          <input placeholder="Credential ID" value={formData.credentialId || ''} onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
          <input placeholder="Credential URL" value={formData.credentialUrl || ''} onChange={(e) => setFormData({ ...formData, credentialUrl: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
          <input placeholder="Skills (comma separated)" value={(formData.skills || []).join(', ')} onChange={(e) => setFormData({ ...formData, skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
          <input placeholder="Evidence URL (optional)" value={formData.evidence || ''} onChange={(e) => setFormData({ ...formData, evidence: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
          <select value={formData.verificationStatus || 'unverified'} onChange={(e) => setFormData({ ...formData, verificationStatus: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400">
            <option value="unverified">Unverified</option>
            <option value="pending">Pending Verification</option>
            <option value="verified">Verified</option>
            <option value="expired">Expired</option>
          </select>
          <button type="button" onClick={() => handleSave('certificate', portfolioService.createCertificate, portfolioService.updateCertificate, setCertificates)} className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            {editingId ? 'Update' : 'Save'}
          </button>
        </div>
      </Modal>

      <Modal open={modal === 'codingProfile'} onClose={closeModal} title={editingId ? 'Edit Coding Profile' : 'Add Coding Profile'}>
        <div className="space-y-3">
          <select value={formData.platform || ''} onChange={(e) => setFormData({ ...formData, platform: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400">
            <option value="">Select Platform</option>
            {CODING_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <input placeholder="Username" value={formData.username || ''} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
          <input placeholder="Profile URL" value={formData.profileUrl || ''} onChange={(e) => setFormData({ ...formData, profileUrl: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
          <input type="number" placeholder="Rating" value={formData.rating || ''} onChange={(e) => setFormData({ ...formData, rating: e.target.value ? Number(e.target.value) : '' })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
          <input type="number" placeholder="Problems Solved" value={formData.problemsSolved || ''} onChange={(e) => setFormData({ ...formData, problemsSolved: e.target.value ? Number(e.target.value) : '' })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
          <input placeholder="Ranking" value={formData.ranking || ''} onChange={(e) => setFormData({ ...formData, ranking: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
          <button type="button" onClick={() => handleSave('codingProfile', portfolioService.createCodingProfile, portfolioService.updateCodingProfile, setCodingProfiles)} className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            {editingId ? 'Update' : 'Save'}
          </button>
        </div>
      </Modal>

      <Modal open={modal === 'experience'} onClose={closeModal} title={editingId ? 'Edit Experience' : 'Add Experience'}>
        <div className="space-y-3">
          <input placeholder="Company" value={formData.company || ''} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
          <input placeholder="Role" value={formData.role || ''} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
          <textarea placeholder="Description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400 h-20 resize-none" />
          <input type="date" placeholder="Start Date" value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ''} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
          <div className="flex items-center gap-3">
            <input type="date" placeholder="End Date" value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ''} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} disabled={formData.isCurrent} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400 disabled:opacity-50" />
            <label className="flex items-center gap-2 whitespace-nowrap text-sm text-slate-600">
              <input type="checkbox" checked={formData.isCurrent || false} onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })} className="rounded" />
              Current
            </label>
          </div>
          <input placeholder="Technologies (comma separated)" value={(formData.technologies || []).join(', ')} onChange={(e) => setFormData({ ...formData, technologies: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
          <button type="button" onClick={() => handleSave('experience', portfolioService.createExperience, portfolioService.updateExperience, setExperiences)} className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            {editingId ? 'Update' : 'Save'}
          </button>
        </div>
      </Modal>

      <Modal open={modal === 'language'} onClose={closeModal} title={editingId ? 'Edit Language' : 'Add Language'}>
        <div className="space-y-3">
          <input placeholder="Language" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
          <select value={formData.proficiency || 'Basic'} onChange={(e) => setFormData({ ...formData, proficiency: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400">
            {PROFICIENCY_LEVELS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button type="button" onClick={() => handleSave('language', portfolioService.createLanguage, portfolioService.updateLanguage, setLanguages)} className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            {editingId ? 'Update' : 'Save'}
          </button>
        </div>
      </Modal>

      <Modal open={modal === 'link'} onClose={closeModal} title={editingId ? 'Edit Link' : 'Add Link'}>
        <div className="space-y-3">
          <input placeholder="Title" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
          <input placeholder="URL" value={formData.url || ''} onChange={(e) => setFormData({ ...formData, url: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
          <select value={formData.platform || 'Other'} onChange={(e) => setFormData({ ...formData, platform: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400">
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button type="button" onClick={() => handleSave('link', portfolioService.createLink, portfolioService.updateLink, setLinks)} className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            {editingId ? 'Update' : 'Save'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

function RecruiterPortfolio() {
  const { user } = useContext(AuthContext)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTech, setFilterTech] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [selectedProject, setSelectedProject] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })

  const fetchProjects = async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, limit: 12 }
      if (search) params.search = search
      if (filterTech) params.technology = filterTech
      if (filterCategory) params.category = filterCategory

      const result = await projectService.getRecruiterProjects(params)
      setProjects(result.projects || [])
      setPagination(result.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      console.error('Failed to fetch recruiter projects:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [search, filterTech, filterCategory])

  const allTechnologies = useMemo(() => {
    const techSet = new Set()
    projects.forEach((p) => (p.technologies || []).forEach((t) => techSet.add(t)))
    return Array.from(techSet).sort()
  }, [projects])

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold text-slate-800">Candidate Portfolios</h1>
        <p className="mt-2 text-slate-500">Browse and evaluate candidate project portfolios with AI scoring.</p>
      </div>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600"><Filter className="h-5 w-5" /></div>
          <h2 className="text-xl font-bold text-slate-800">Filters</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400"
            />
          </div>
          <select
            value={filterTech}
            onChange={(e) => setFilterTech(e.target.value)}
            className="rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-400"
          >
            <option value="">All Technologies</option>
            {['React', 'FastAPI', 'Node.js', 'Python', 'MongoDB', 'AI', 'TypeScript', 'Docker', 'AWS'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-400"
          >
            <option value="">All Categories</option>
            {PROJECT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Projects</h2>
            <p className="text-xs text-slate-400">{pagination.total} project{pagination.total !== 1 ? 's' : ''} found</p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="py-10 text-center">
            <FolderKanban className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="font-medium text-slate-500">No projects match your filters</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onSelect={setSelectedProject}
                />
              ))}
            </div>
            {pagination.pages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => fetchProjects(page)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${page === pagination.page ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Recruiter Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSelectedProject(null)} />
          <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">{selectedProject.title}</h3>
              <button type="button" onClick={() => setSelectedProject(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              {typeof selectedProject.userId === 'object' && (
                <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2">
                  <UserCircle2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-800">{selectedProject.userId.name}</span>
                  <span className="text-xs text-slate-500">{selectedProject.userId.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">{selectedProject.category || 'Other'}</span>
              </div>
              {selectedProject.description && (
                <p className="text-sm text-slate-600">{selectedProject.description}</p>
              )}
              {selectedProject.technologies?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedProject.technologies.map((tech, i) => (
                    <TechnologyBadge key={i} name={tech} size="md" />
                  ))}
                </div>
              )}
              <ProjectScoreCard score={selectedProject.projectScore} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Portfolio({ role, section }) {
  return role === 'candidate'
    ? <CandidatePortfolio section={section} />
    : <RecruiterPortfolio />
}

export default Portfolio
