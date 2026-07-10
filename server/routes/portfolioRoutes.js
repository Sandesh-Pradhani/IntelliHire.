const express = require('express');
const Project = require('../models/Project');
const Certificate = require('../models/Certificate');
const CodingProfile = require('../models/CodingProfile');
const PortfolioLink = require('../models/PortfolioLink');
const Language = require('../models/Language');
const Experience = require('../models/Experience');
const AcademicProfile = require('../models/AcademicProfile');
const Resume = require('../models/Resume');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const router = express.Router();

router.get('/', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const userId = req.user.id;
    const [projects, certificates, codingProfiles, links, languages, experience, academicProfile, resume] = await Promise.all([
      Project.find({ userId }).sort({ createdAt: -1 }),
      Certificate.find({ userId }).sort({ createdAt: -1 }),
      CodingProfile.find({ userId }).sort({ createdAt: -1 }),
      PortfolioLink.find({ userId }).sort({ createdAt: -1 }),
      Language.find({ userId }).sort({ name: 1 }),
      Experience.find({ userId }).sort({ startDate: -1 }),
      AcademicProfile.findOne({ candidateId: userId }),
      Resume.findOne({ userId }).sort({ uploadedAt: -1 })
    ]);
    res.json({ projects, certificates, codingProfiles, links, languages, experience, academicProfile, resume });
  } catch (error) {
    console.error('[Portfolio Error]:', error);
    res.status(500).json({ message: 'Failed to fetch portfolio' });
  }
});

module.exports = router;
