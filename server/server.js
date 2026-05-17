const express = require('express')
const cors = require('cors')

/*
WHY EXPRESS?

Backend framework for APIs.
*/

const app = express()

/*
WHY CORS?

Frontend and backend run on different ports.

5173 → React
5000 → Backend

Browser blocks requests without CORS.
*/

app.use(cors())

/*
WHY express.json()?

Converts incoming JSON body
into JavaScript object.
*/

app.use(express.json())

/*
IMPORT ROUTES
*/

const aiRoutes = require('./routes/aiRoutes')

/*
REGISTER ROUTES
*/

app.use('/api/ai', aiRoutes)

/*
TEST ROUTE
*/

app.get('/', (req, res) => {

    res.send('IntelliHire Backend Running')

})

/*
START SERVER
*/

app.listen(5000, () => {

    console.log('Server Running on Port 5000')

})