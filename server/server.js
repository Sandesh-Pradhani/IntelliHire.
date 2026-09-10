const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.join(__dirname, '.env') })

const connectDB = require('./config/db')
const applicationRoutes = require('./routes/applicationRoutes')
const authRoutes = require('./routes/authRoutes')
const aiRoutes = require('./routes/aiRoutes')
const resumeRoutes = require('./routes/resumeRoutes')
const jobRoutes = require('./routes/jobRoutes')
const feedbackRoutes = require('./routes/feedbackRoutes')
const recruiterRoutes = require('./routes/recruiterRoutes')
const academicRoutes = require('./routes/academicRoutes')
const portfolioRoutes = require('./routes/portfolioRoutes')
const savedJobsRoutes = require('./routes/savedJobsRoutes')
const notificationsRoutes = require('./routes/notificationsRoutes')
const candidateIntelligenceRoutes = require('./routes/candidateIntelligenceRoutes')
const copilotRoutes = require('./routes/copilotRoutes')
const decisionIntelligenceRoutes = require('./routes/decisionIntelligenceRoutes')
const organizationRoutes = require('./routes/organizationRoutes')
const codingProfileRoutes = require('./routes/codingProfileRoutes')
const recruiterProjectRoutes = require('./routes/recruiterProjectRoutes')
const resumeBuilderRoutes = require('./routes/resumeBuilderRoutes')
const certificateRoutes = require('./routes/certificateRoutes')

connectDB()

const app = express()

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true
    })
)

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://intelli-hire-chi.vercel.app"
  ],
  credentials: true
}))

app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/resumes', resumeRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/recruiter', recruiterRoutes)
app.use('/api/academic', academicRoutes)
app.use('/api/portfolio', portfolioRoutes)
app.use('/api/saved-jobs', savedJobsRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/intelligence', candidateIntelligenceRoutes)
app.use('/api/candidates', candidateIntelligenceRoutes)
app.use('/api/copilot', copilotRoutes)
app.use('/api/decision-intelligence', decisionIntelligenceRoutes)
app.use('/api/organizations', organizationRoutes)
app.use('/api/coding-profile', codingProfileRoutes)
app.use('/api/recruiter/portfolio', recruiterProjectRoutes)
app.use('/api/resume-builder', resumeBuilderRoutes)
app.use('/api/certificates', certificateRoutes)

app.get('/', (req, res) => {
    res.send('IntelliHire Backend Running')
})

app.listen(5000, () => {
    console.log('Server Running on Port 5000')
})
