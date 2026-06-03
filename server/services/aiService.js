const axios = require('axios')

const matchCandidate = async (

    payload

) => {

    const response = await axios.post(

        `${process.env.AI_ENGINE_URL}/job-match`,

        payload

    )

    return response.data
}

module.exports = {

    matchCandidate
}