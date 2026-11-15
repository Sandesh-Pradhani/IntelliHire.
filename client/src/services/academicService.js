import axios from 'axios'

const API_URL =
`${import.meta.env.VITE_API_URL}/api/academic`

const getToken = () => {

    return localStorage.getItem('token')
}

export const getAcademicProfile = async () => {

    const response = await axios.get(

        API_URL,

        {

            headers: {

                Authorization:
                    `Bearer ${getToken()}`
            }
        }
    )

    return response.data
}

export const createAcademicProfile =
async (data) => {

    const response = await axios.post(

        API_URL,

        data,

        {

            headers: {

                Authorization:
                    `Bearer ${getToken()}`
            }
        }
    )

    return response.data
}

export const updateAcademicProfile =
async (data) => {

    const response = await axios.put(

        API_URL,

        data,

        {

            headers: {

                Authorization:
                    `Bearer ${getToken()}`
            }
        }
    )

    return response.data
}