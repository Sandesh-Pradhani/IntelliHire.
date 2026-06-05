const axios = require('axios')

const matchCandidate = async (payload) => {

    try {

        console.log('AI ENGINE URL:')
        console.log(process.env.AI_ENGINE_URL)

        const response = await axios.post(

            `${process.env.AI_ENGINE_URL}/job-match`,

            payload
        )

        return response.data

    } catch (error) {

        console.log('AI SERVICE ERROR')

        console.log(error.message)

        if (error.response) {

            console.log('STATUS:')

            console.log(error.response.status)

            console.log('DATA:')

            console.log(error.response.data)
        }

        throw error
    }
}

module.exports = {

    matchCandidate
}