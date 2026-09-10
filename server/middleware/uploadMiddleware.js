const multer = require('multer')
const path = require('path')
const fs = require('fs')

const uploadDir = 'uploads/'
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

/*
WHY diskStorage?

Defines:
- filename
- destination
*/

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, uploadDir)
    },

    filename: (req, file, cb) => {

        /*
        WHY Date.now()?

        Prevent duplicate filenames.
        */

        const ext = path.extname(file.originalname).toLowerCase()
        const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
        cb(null, safeName)
    }
})

/*
CREATE MULTER INSTANCE
*/

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg']
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Only PDF, PNG, JPG, and JPEG files are allowed'))
        }
        cb(null, true)
    }
})

module.exports = upload
