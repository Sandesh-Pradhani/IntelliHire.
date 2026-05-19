const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

const connectDB = require('./config/db')

const authRoutes = require('./routes/authRoutes')
const aiRoutes = require('./routes/aiRoutes')

dotenv.config()

connectDB()

const app = express()

app.use(cors())

app.use(express.json())

app.use('/api/auth', authRoutes)

app.use('/api/ai', aiRoutes)

app.get('/', (req, res) => {

    res.send('IntelliHire Backend Running')
})

app.listen(5000, () => {

    console.log('Server Running on Port 5000')
})