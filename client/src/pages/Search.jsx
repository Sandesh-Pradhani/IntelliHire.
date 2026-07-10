import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon,
  Filter,
  X,
  MapPin,
  Briefcase,
  DollarSign,
  GraduationCap,
  Clock,
  ChevronDown,
  FileText,
  Mail,
  Star,
  Loader2,
  Inbox,
  Send,
} from 'lucide-react';

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const STATUS_OPTIONS = ['Applied', 'Screening', 'Shortlisted', 'Assessment', 'Interview', 'Technical Round', 'HR Round', 'Offered', 'Accepted', 'Rejected', 'Hired'];

const STATUS_COLORS = {
  Applied: 'bg-blue-100 text-blue-700',
  Screening: 'bg-amber-100 text-amber-700',
  Shortlisted: 'bg-emerald-100 text-emerald-700',
  Assessment: 'bg-indigo-100 text-indigo-700',
  Interview: 'bg-violet-100 text-violet-700',
  'Technical Round': 'bg-cyan-100 text-cyan-700',
  'HR Round': 'bg-pink-100 text-pink-700',
  Offered: 'bg-emerald-100 text-emerald-700',
  Accepted: 'bg-green-100 text-green-700',
  Rejected: 'bg-rose-100 text-rose-700',
  Hired: 'bg-green-100 text-green-700',
};

const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-gray-200 rounded-full" />
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="flex gap-2 mt-2">
          <div className="h-6 bg-gray-200 rounded-full w-16" />
          <div className="h-6 bg-gray-200 rounded-full w-20" />
          <div className="h-6 bg-gray-200 rounded-full w-14" />
        </div>
      </div>
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-500 max-w-sm">{description}</p>
  </div>
);

export default function Search() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('candidates');
  const [showFilters, setShowFilters] = useState(false);

  // Candidate search state
  const [candidateQuery, setCandidateQuery] = useState('');
  const [candidateSkills, setCandidateSkills] = useState('');
  const [candidateAtsMin, setCandidateAtsMin] = useState(0);
  const [candidateAtsMax, setCandidateAtsMax] = useState(100);
  const [candidateStatus, setCandidateStatus] = useState('');
  const [candidateResults, setCandidateResults] = useState([]);
  const [candidateLoading, setCandidateLoading] = useState(false);

  // Job search state
  const [jobQuery, setJobQuery] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [jobExperience, setJobExperience] = useState('');
  const [jobSalaryMin, setJobSalaryMin] = useState('');
  const [jobSalaryMax, setJobSalaryMax] = useState('');
  const [jobSkills, setJobSkills] = useState('');
  const [jobResults, setJobResults] = useState([]);
  const [jobLoading, setJobLoading] = useState(false);

  // Application modal
  const [applyModal, setApplyModal] = useState({ open: false, jobId: null, jobTitle: '' });
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [applying, setApplying] = useState(false);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  const searchCandidates = useCallback(async () => {
    setCandidateLoading(true);
    try {
      const params = new URLSearchParams();
      if (candidateQuery) params.set('q', candidateQuery);
      if (candidateSkills) params.set('skills', candidateSkills);
      if (candidateAtsMin > 0) params.set('atsMin', candidateAtsMin);
      if (candidateAtsMax < 100) params.set('atsMax', candidateAtsMax);
      if (candidateStatus) params.set('status', candidateStatus);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/search/candidates?${params}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setCandidateResults(data.candidates || data || []);
      }
    } catch (err) {
      console.error('Failed to search candidates:', err);
    } finally {
      setCandidateLoading(false);
    }
  }, [candidateQuery, candidateSkills, candidateAtsMin, candidateAtsMax, candidateStatus]);

  const searchJobs = useCallback(async () => {
    setJobLoading(true);
    try {
      const params = new URLSearchParams();
      if (jobQuery) params.set('q', jobQuery);
      if (jobLocation) params.set('location', jobLocation);
      if (jobType) params.set('jobType', jobType);
      if (jobExperience) params.set('experience', jobExperience);
      if (jobSalaryMin) params.set('salaryMin', jobSalaryMin);
      if (jobSalaryMax) params.set('salaryMax', jobSalaryMax);
      if (jobSkills) params.set('skills', jobSkills);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/search/jobs?${params}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setJobResults(data.jobs || data || []);
      }
    } catch (err) {
      console.error('Failed to search jobs:', err);
    } finally {
      setJobLoading(false);
    }
  }, [jobQuery, jobLocation, jobType, jobExperience, jobSalaryMin, jobSalaryMax, jobSkills]);

  useEffect(() => {
    if (activeTab === 'candidates') {
      searchCandidates();
    } else {
      searchJobs();
    }
  }, [activeTab]);

  const fetchResumes = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/resumes`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setResumes(data.resumes || data || []);
      }
    } catch (err) {
      console.error('Failed to fetch resumes:', err);
    }
  };

  const handleApply = (job) => {
    fetchResumes();
    setApplyModal({ open: true, jobId: job._id || job.id, jobTitle: job.title });
    setSelectedResumeId('');
  };

  const submitApplication = async () => {
    if (!selectedResumeId) return;
    setApplying(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/applications/apply`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ jobId: applyModal.jobId, resumeId: selectedResumeId }),
      });
      if (res.ok) {
        setApplyModal({ open: false, jobId: null, jobTitle: '' });
      }
    } catch (err) {
      console.error('Failed to apply:', err);
    } finally {
      setApplying(false);
    }
  };

  const clearCandidateFilters = () => {
    setCandidateQuery('');
    setCandidateSkills('');
    setCandidateAtsMin(0);
    setCandidateAtsMax(100);
    setCandidateStatus('');
  };

  const clearJobFilters = () => {
    setJobQuery('');
    setJobLocation('');
    setJobType('');
    setJobExperience('');
    setJobSalaryMin('');
    setJobSalaryMax('');
    setJobSkills('');
  };

  const handleCandidateSearch = (e) => {
    e.preventDefault();
    searchCandidates();
  };

  const handleJobSearch = (e) => {
    e.preventDefault();
    searchJobs();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Search</h1>
          <p className="text-sm text-gray-500 mt-1">Find candidates and job opportunities</p>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
          <button
            onClick={() => setActiveTab('candidates')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'candidates'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Candidates
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'jobs'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Jobs
          </button>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <></>
            {showFilters && (
              <aside
                className="shrink-0 overflow-hidden"
              >
                <div className="bg-white rounded-xl border border-gray-100 p-5 w-[280px]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Filters</h3>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="p-1 hover:bg-gray-100 rounded-md"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>

                  {activeTab === 'candidates' ? (
                    <div className="space-y-5">
                      {/* Skills */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Skills</label>
                        <input
                          type="text"
                          value={candidateSkills}
                          onChange={(e) => setCandidateSkills(e.target.value)}
                          placeholder="e.g. React, Node.js"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* ATS Score Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          ATS Score: {candidateAtsMin} - {candidateAtsMax}
                        </label>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-8">Min</span>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={candidateAtsMin}
                              onChange={(e) => setCandidateAtsMin(Number(e.target.value))}
                              className="flex-1 accent-blue-500"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-8">Max</span>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={candidateAtsMax}
                              onChange={(e) => setCandidateAtsMax(Number(e.target.value))}
                              className="flex-1 accent-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                        <select
                          value={candidateStatus}
                          onChange={(e) => setCandidateStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                          <option value="">All statuses</option>
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={clearCandidateFilters}
                        className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Location */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                        <input
                          type="text"
                          value={jobLocation}
                          onChange={(e) => setJobLocation(e.target.value)}
                          placeholder="e.g. New York, Remote"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Job Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Type</label>
                        <select
                          value={jobType}
                          onChange={(e) => setJobType(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                          <option value="">All types</option>
                          {JOB_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      {/* Experience */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Experience Level</label>
                        <input
                          type="text"
                          value={jobExperience}
                          onChange={(e) => setJobExperience(e.target.value)}
                          placeholder="e.g. Senior, 3+ years"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Salary Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Salary Range</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={jobSalaryMin}
                            onChange={(e) => setJobSalaryMin(e.target.value)}
                            placeholder="Min"
                            className="w-1/2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="number"
                            value={jobSalaryMax}
                            onChange={(e) => setJobSalaryMax(e.target.value)}
                            placeholder="Max"
                            className="w-1/2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Skills */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Skills</label>
                        <input
                          type="text"
                          value={jobSkills}
                          onChange={(e) => setJobSkills(e.target.value)}
                          placeholder="e.g. React, Python"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <button
                        onClick={clearJobFilters}
                        className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              </aside>
            )}
          <></>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search Bar */}
            <form onSubmit={activeTab === 'candidates' ? handleCandidateSearch : handleJobSearch} className="mb-6">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={activeTab === 'candidates' ? candidateQuery : jobQuery}
                    onChange={(e) =>
                      activeTab === 'candidates'
                        ? setCandidateQuery(e.target.value)
                        : setJobQuery(e.target.value)
                    }
                    placeholder={activeTab === 'candidates' ? 'Search candidates...' : 'Search jobs...'}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-colors ${
                    showFilters
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Results */}
            {activeTab === 'candidates' ? (
              candidateLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : candidateResults.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No candidates found"
                  description="Try adjusting your search query or filters to find candidates."
                />
              ) : (
                <div className="space-y-4">
                  {candidateResults.map((candidate, idx) => (
                    <div
                      key={candidate._id || candidate.id || idx}
                      className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-blue-700">
                            {(candidate.name || candidate.fullName || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {candidate.name || candidate.fullName || 'Unknown'}
                            </h3>
                            {candidate.atsScore != null && (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                                ATS: {candidate.atsScore}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="truncate">{candidate.email || 'No email'}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {(candidate.skills || []).slice(0, 6).map((skill, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                            {(candidate.skills || []).length > 6 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                                +{candidate.skills.length - 6}
                              </span>
                            )}
                          </div>
                          {candidate.resumeStatus && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                              <FileText className="w-3.5 h-3.5" />
                              Resume: {candidate.resumeStatus}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : jobLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : jobResults.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No jobs found"
                description="Try adjusting your search query or filters to find job opportunities."
              />
            ) : (
              <div className="space-y-4">
                {jobResults.map((job, idx) => (
                  <div
                    key={job._id || job.id || idx}
                    className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">{job.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
                          {job.company && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3.5 h-3.5" />
                              {job.company}
                            </span>
                          )}
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {job.location}
                            </span>
                          )}
                          {job.type && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {job.type}
                            </span>
                          )}
                          {(job.salaryMin || job.salaryMax) && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5" />
                              {job.salaryMin && job.salaryMax
                                ? `${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
                                : job.salaryMin
                                ? `From ${job.salaryMin.toLocaleString()}`
                                : `Up to ${job.salaryMax?.toLocaleString()}`}
                            </span>
                          )}
                          {job.experience && (
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5" />
                              {job.experience}
                            </span>
                          )}
                        </div>
                        {(job.skills || job.skillsRequired) && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {(job.skills || job.skillsRequired || []).slice(0, 8).map((skill, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleApply(job)}
                        className="shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <></>
        {applyModal.open && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setApplyModal({ open: false, jobId: null, jobTitle: '' })}
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Apply for {applyModal.jobTitle}</h2>
              <p className="text-sm text-gray-500 mb-5">Select a resume to submit with your application.</p>

              {resumes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No resumes found. Please upload a resume first.</p>
              ) : (
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white mb-4"
                >
                  <option value="">Select a resume</option>
                  {resumes.map((r) => (
                    <option key={r._id || r.id} value={r._id || r.id}>
                      {r.title || r.fileName || `Resume ${(r._id || r.id || '').slice(-4)}`}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setApplyModal({ open: false, jobId: null, jobTitle: '' })}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitApplication}
                  disabled={!selectedResumeId || applying}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {applying && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Application
                </button>
              </div>
            </div>
          </div>
        )}
      <></>
    </div>
  );
}
