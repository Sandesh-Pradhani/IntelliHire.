const express = require('express');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const router = express.Router();

router.get('/recruiter', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try {
    const apps = await Application.find().populate('candidateId','name email').populate('jobId','title company').sort({createdAt:-1});
    res.json(apps);
  } catch(e) { res.status(500).json({message:'Failed'}); }
});

router.get('/candidate', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const apps = await Application.find({candidateId:req.user.id}).populate('jobId','title company location jobType salaryMin salaryMax').sort({createdAt:-1});
    res.json(apps);
  } catch(e) { res.status(500).json({message:'Failed'}); }
});

router.post('/apply', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const {jobId,resumeId}=req.body;
    const Job=require('../models/Job'), Resume=require('../models/Resume'), User=require('../models/User');
    const job=await Job.findById(jobId);
    if(!job) return res.status(404).json({message:'Job not found'});
    if(job.status!=='active') return res.status(400).json({message:'Job closed'});
    const existing=await Application.findOne({candidateId:req.user.id,jobId});
    if(existing) return res.status(400).json({message:'Already applied'});
    const user=await User.findById(req.user.id);
    const resume=resumeId?await Resume.findById(resumeId):null;
    const app=await Application.create({
      candidateId:req.user.id, resumeId:resumeId||undefined, jobId,
      candidateName:user?.name||'Unknown', candidateEmail:user?.email||'Unknown',
      jobTitle:job.title||'Unknown', atsScore:resume?.atsScore||0,
      matchedSkills:resume?.extractedSkills||[], status:'Applied',
      timeline:[{status:'Applied',changedBy:'candidate',note:'Submitted'}]
    });
    await Job.findByIdAndUpdate(jobId,{$inc:{applicantsCount:1}});
    try{await Notification.create({userId:job.postedBy,type:'application',title:'New Application',message:user?.name+' applied for '+job.title,link:'/applications',relatedId:app._id});}catch(_){}
    res.status(201).json(app);
  } catch(e) { res.status(500).json({message:'Failed'}); }
});

router.put('/withdraw/:id', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const app=await Application.findById(req.params.id);
    if(!app) return res.status(404).json({message:'Not found'});
    if(app.candidateId.toString()!==req.user.id) return res.status(403).json({message:'Access denied'});
    if(['Rejected','Hired'].includes(app.status)) return res.status(400).json({message:'Cannot withdraw'});
    app.status='Rejected'; app.timeline.push({status:'Rejected',changedBy:'candidate',note:'Withdrawn'});
    await app.save();
    res.json({message:'Withdrawn'});
  } catch(e) { res.status(500).json({message:'Failed'}); }
});

router.put('/status/:id', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try {
    const {status,note}=req.body;
    const valid=['Applied','Screening','Shortlisted','Interview','Selected','Rejected','Hired'];
    if(!valid.includes(status)) return res.status(400).json({message:'Invalid'});
    const app=await Application.findById(req.params.id);
    if(!app) return res.status(404).json({message:'Not found'});
    app.status=status; app.timeline.push({status,changedBy:'recruiter',note:note||'To '+status});
    if(note) app.recruiterNotes=note;
    await app.save();
    try{await Notification.create({userId:app.candidateId,type:'status_update',title:'Status Updated',message:app.jobTitle+' -> '+status,link:'/candidate/applications',relatedId:app._id});}catch(_){}
    res.json(app);
  } catch(e) { res.status(500).json({message:'Failed'}); }
});

router.get('/stats', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try {
    const total=await Application.countDocuments();
    const sc=await Application.aggregate([{$group:{_id:'$status',count:{$sum:1}}}]);
    const counts={}; sc.forEach(s=>counts[s._id]=s.count);
    const avg=await Application.aggregate([{$match:{matchScore:{$gt:0}}},{$group:{_id:null,avg:{$avg:'$matchScore'}}}]);
    res.json({total,statusCounts:counts,averageMatchScore:avg.length?Math.round(avg[0].avg):0});
  } catch(e) { res.status(500).json({message:'Failed'}); }
});

router.get('/candidate/stats', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const apps=await Application.find({candidateId:req.user.id});
    const counts={}; let ts=0,mc=0;
    apps.forEach(a=>{counts[a.status]=(counts[a.status]||0)+1;if(a.matchScore>0){ts+=a.matchScore;mc++;}});
    res.json({total:apps.length,statusCounts:counts,averageMatchScore:mc?Math.round(ts/mc):0});
  } catch(e) { res.status(500).json({message:'Failed'}); }
});

module.exports = router;
