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
const interviewRoutes = require('./routes/interviewRoutes')
const notesRoutes = require('./routes/notesRoutes')
const companyRoutes = require('./routes/companyRoutes')
const projectRoutes = require('./routes/projectRoutes')
const certificateRoutes = require('./routes/certificateRoutes')
const codingProfileRoutes = require('./routes/codingProfileRoutes')
const searchRoutes = require('./routes/searchRoutes')
const adminRoutes = require('./routes/adminRoutes')
const analyticsRoutes = require('./routes/analyticsRoutes')
const settingsRoutes = require('./routes/settingsRoutes')
const emailRoutes = require('./routes/emailRoutes')

connectDB()

const app = express()

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://intelli-hire-chi.vercel.app"
  ],
  credentials: true
}))

app.use(express.json())

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
app.use('/api/interviews', interviewRoutes)
app.use('/api/notes', notesRoutes)
app.use('/api/company', companyRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/certificates', certificateRoutes)
app.use('/api/coding-profiles', codingProfileRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/email', emailRoutes)

app.get('/', (req, res) => {
    res.send('IntelliHire Backend Running')
})

app.listen(5000, () => {
    console.log('Server Running on Port 5000')
})
