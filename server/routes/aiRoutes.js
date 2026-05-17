const express = require('express')
const axios = require('axios')

const router = express.Router()

router.post('/extract-skills', async (req, res) => {

    try {

        const { text } = req.body

        /*
        SEND TO PYTHON AI ENGINE
        */

        const response = await axios.post(
            'http://127.0.0.1:8000/extract-skills',
            {
                text: text
            }
        )

        /*
        RETURN RESPONSE TO FRONTEND
        */

        res.json(response.data)

    } catch (error) {

        console.log(error)

        res.status(500).json({
            message: 'AI Extraction Failed'
        })
    }
})

module.exports = router