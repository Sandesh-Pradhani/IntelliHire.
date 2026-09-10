const axios = require('axios')

const matchCandidate = async (payload) => {

    try {

        console.log('AI ENGINE URL:')
        console.log(process.env.AI_ENGINE_URL)

        const response = await axios.post(

            `${process.env.AI_ENGINE_URL}/job-match`,

            payload
        )

        // FastAPI returns a standard envelope: { success, data, message, execution_time, model_used }
        // Extract the data field so callers get the match payload directly.
        return response.data.data || response.data

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