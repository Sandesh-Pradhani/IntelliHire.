const multer = require('multer')

/*
WHY diskStorage?

Defines:
- filename
- destination
*/

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, 'uploads/')
    },

    filename: (req, file, cb) => {

        /*
        WHY Date.now()?

        Prevent duplicate filenames.
        */

        cb(null, Date.now() + '-' + file.originalname)
    }
})

/*
CREATE MULTER INSTANCE
*/

const upload = multer({
    storage: storage
})

module.exports = upload