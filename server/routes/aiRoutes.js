const express = require('express')
const axios = require('axios')

const router = express.Router()

/*
WHY AXIOS?

Backend must communicate with AI engine.

Express itself cannot send HTTP requests easily.
Axios acts as HTTP client.

Node Backend
↓ axios request
Flask AI Engine
*/

router.post('/extract-skills', async (req, res) => {

    try {

        // frontend sends text
        const { text } = req.body

        /*
        WHY THIS REQUEST?

        Backend delegates AI work to Python engine.
        */

        const response = await axios.post(
            'http://127.0.0.1:8000/extract-skills',
            {
                text: text
            }
        )

        /*
        Flask returns:
        {
           skills: [...]
        }
        */

        res.json(response.data)

    } catch (error) {

        console.log(error)

        res.status(500).json({
            message: 'AI Engine Error'
        })
    }
})

module.exports = router