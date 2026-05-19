const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {

    try {

        /*
        HEADER FORMAT:

        Bearer token_here
        */

        const token = req.header('Authorization')

        if (!token) {

            return res.status(401).json({
                message: 'No token'
            })
        }

        const actualToken = token.split(' ')[1]

        const decoded = jwt.verify(

            actualToken,

            process.env.JWT_SECRET
        )

        req.user = decoded

        next()

    } catch (error) {

        res.status(401).json({
            message: 'Unauthorized'
        })
    }
}

module.exports = authMiddleware