const express = require('express')
const cors = require('cors')
//const mongoose = require('mongoose')
//require('dotenv').config()
const aiRoutes = require('./routes/aiRoutes')

app.use('/api/ai', aiRoutes)
app.use(express.json())

app.use('/api/ai', aiRoutes)

const app = express()

app.use(cors())
app.use(express.json())

/*mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB Connected'))
.catch((err) => console.log(err))
*/
app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/resume', require('./routes/resumeRoutes'))

app.get('/', (req, res) => {
  res.send('IntelliHire Backend Running')
})

app.listen(5000, () => {
  console.log('Server Running on Port 5000')
})