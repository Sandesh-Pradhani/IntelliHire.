const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const upload = require('../middleware/uploadMiddleware')
const certificateController = require('../controllers/certificateController')

const router = express.Router()

function handleEvidenceUpload(req, res, next) {
    upload.single('evidence')(req, res, (error) => {
        if (error) return res.status(400).json({ message: error.message || 'Invalid evidence upload' })
        next()
    })
}

router.use(authMiddleware)

router.get('/', requireRole('candidate'), certificateController.getCertificates)
router.get('/stats', requireRole('candidate'), certificateController.getCertificateStats)
router.get('/candidate/:candidateId', requireRole('recruiter'), certificateController.getCandidateCertificates)
router.get('/:id', requireRole('candidate'), certificateController.getCertificate)
router.post('/', requireRole('candidate'), handleEvidenceUpload, certificateController.createCertificate)
router.put('/:id', requireRole('candidate'), handleEvidenceUpload, certificateController.updateCertificate)
router.delete('/:id', requireRole('candidate'), certificateController.deleteCertificate)
router.post('/:id/verify', requireRole('candidate'), certificateController.verifyCertificate)
router.post('/:id/score', requireRole('candidate'), certificateController.scoreCertificateHandler)

module.exports = router
