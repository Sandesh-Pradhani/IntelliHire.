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
}));

app.use(express.json())

app.use('/api/auth', authRoutes)

app.use('/api/ai', aiRoutes)

app.use('/api/resumes', resumeRoutes)

app.use('/api/jobs', jobRoutes)
app.use(

    '/api/applications',

    applicationRoutes
)

app.use('/api/feedback', feedbackRoutes)
app.use('/api/recruiter', recruiterRoutes)

app.get('/', (req, res) => {

    res.send('IntelliHire Backend Running')
})

app.listen(5000, () => {

    console.log('Server Running on Port 5000')
})
