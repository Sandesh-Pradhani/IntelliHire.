const mongoose = require('mongoose');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const BASE_URL = `http://localhost:5000/api`;

async function runTests() {
    console.log('--- STARTING ROLE ARCHITECTURE AND APPLICATION ENGINE INTEGRATION TESTS ---');

    // Generate random emails so runs don't conflict
    const candidateEmail = `candidate_${Date.now()}@test.com`;
    const recruiterEmail = `recruiter_${Date.now()}@test.com`;
    const password = 'Password123';

    let candidateToken, recruiterToken;
    let candidateId, recruiterId;
    let jobId, resumeId, applicationId;

    try {
        // --- 1. Validate Registration Requires Role Selection ---
        console.log('\n[TEST 1] Registering user without role...');
        try {
            await axios.post(`${BASE_URL}/auth/register`, {
                name: 'No Role User',
                email: `norole_${Date.now()}@test.com`,
                password
            });
            console.error('❌ FAIL: Registered user without selecting role.');
        } catch (err) {
            if (err.response && err.response.status === 400) {
                console.log('✅ PASS: Registration without role selection rejected (400).');
            } else {
                console.error(`❌ FAIL: Registration failed with unexpected status: ${err.response?.status || err.message}`);
            }
        }

        // --- 2. Register Candidate & Recruiter ---
        console.log('\n[TEST 2] Registering valid candidate and recruiter...');
        const candReg = await axios.post(`${BASE_URL}/auth/register`, {
            name: 'Test Candidate',
            email: candidateEmail,
            password,
            role: 'candidate'
        });
        candidateId = candReg.data.user.id;
        console.log(`- Candidate registered: ${candidateEmail} (${candidateId})`);

        const recReg = await axios.post(`${BASE_URL}/auth/register`, {
            name: 'Test Recruiter',
            email: recruiterEmail,
            password,
            role: 'recruiter'
        });
        recruiterId = recReg.data.user.id;
        console.log(`- Recruiter registered: ${recruiterEmail} (${recruiterId})`);

        // --- 3. Login and Obtain JWTs ---
        console.log('\n[TEST 3] Logging in to get JWTs...');
        const candLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: candidateEmail,
            password
        });
        candidateToken = candLogin.data.token;
        console.log('- Candidate JWT obtained.');

        const recLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: recruiterEmail,
            password
        });
        recruiterToken = recLogin.data.token;
        console.log('- Recruiter JWT obtained.');

        // --- 4. Verify Candidate Cannot Create Jobs ---
        console.log('\n[TEST 4] Attempting to create job as Candidate...');
        try {
            await axios.post(
                `${BASE_URL}/jobs/create`,
                { title: 'Software Engineer', company: 'TechCorp', description: 'React and Node developer' },
                { headers: { Authorization: `Bearer ${candidateToken}` } }
            );
            console.error('❌ FAIL: Candidate was able to create a job!');
        } catch (err) {
            if (err.response && err.response.status === 403) {
                console.log('✅ PASS: Candidate job creation blocked with 403.');
            } else {
                console.error(`❌ FAIL: Unexpected error: ${err.response?.status || err.message}`);
            }
        }

        // --- 5. Verify Recruiter Can Create Jobs ---
        console.log('\n[TEST 5] Attempting to create job as Recruiter...');
        const jobRes = await axios.post(
            `${BASE_URL}/jobs/create`,
            { title: 'Software Engineer', company: 'TechCorp', description: 'React and Node developer', requiredSkills: ['React', 'NodeJS'] },
            { headers: { Authorization: `Bearer ${recruiterToken}` } }
        );
        jobId = jobRes.data._id;
        console.log(`✅ PASS: Recruiter created job. Job ID: ${jobId}`);

        // --- 6. Verify Recruiter Cannot Access Candidate Profile API ---
        console.log('\n[TEST 6] Recruiter attempting to access candidate academic profile...');
        try {
            await axios.get(`${BASE_URL}/academic`, {
                headers: { Authorization: `Bearer ${recruiterToken}` }
            });
            console.error('❌ FAIL: Recruiter was allowed access to academic profile.');
        } catch (err) {
            if (err.response && err.response.status === 403) {
                console.log('✅ PASS: Recruiter access blocked with 403.');
            } else {
                console.error(`❌ FAIL: Unexpected status: ${err.response?.status || err.message}`);
            }
        }

        // --- 7. Verify Academic Profile Rejects Non-Number Semester ---
        console.log('\n[TEST 7] Creating academic profile with "7th" semester...');
        try {
            await axios.post(
                `${BASE_URL}/academic`,
                { cgpa: 8.5, branch: 'CS', college: 'IIT', graduationYear: 2026, currentSemester: '7th', backlogs: 0 },
                { headers: { Authorization: `Bearer ${candidateToken}` } }
            );
            console.error('❌ FAIL: Academic profile accepted "7th" as semester.');
        } catch (err) {
            if (err.response && err.response.status === 400) {
                console.log('✅ PASS: Semester "7th" rejected with 400 Bad Request.');
            } else {
                console.error(`❌ FAIL: Unexpected error: ${err.response?.status || err.message}`);
            }
        }

        // --- 8. Verify Academic Profile Accepts Number Semester ---
        console.log('\n[TEST 8] Creating academic profile with number 7 semester...');
        const acadRes = await axios.post(
            `${BASE_URL}/academic`,
            { cgpa: 8.5, branch: 'CS', college: 'IIT', graduationYear: 2026, currentSemester: 7, backlogs: 0 },
            { headers: { Authorization: `Bearer ${candidateToken}` } }
        );
        console.log(`✅ PASS: Academic profile created successfully (currentSemester: ${acadRes.data.currentSemester}).`);

        // --- 9. Prepare a Mock Resume for Application ---
        console.log('\n[TEST 9] Creating mock resume for candidate to enable application match...');
        await mongoose.connect(process.env.MONGO_URI);
        const Resume = require('./models/Resume');
        const resumeDoc = await Resume.create({
            userId: candidateId,
            fileName: 'candidate_resume.pdf',
            extractedSkills: ['React', 'NodeJS', 'MongoDB'],
            atsScore: 85
        });
        resumeId = resumeDoc._id;
        console.log(`- Created mock resume in DB: ${resumeId}`);

        // --- 10. Candidate Applies to Job ---
        console.log('\n[TEST 10] Candidate applying to job...');
        const appRes = await axios.post(
            `${BASE_URL}/applications/apply`,
            { jobId, resumeId },
            { headers: { Authorization: `Bearer ${candidateToken}` } }
        );
        applicationId = appRes.data._id;
        console.log(`✅ PASS: Application submitted. ID: ${applicationId}, status: ${appRes.data.status}`);

        // --- 11. Recruiter Updates Application Status ---
        console.log('\n[TEST 11] Recruiter updating application status to Shortlisted...');
        const updateRes = await axios.put(
            `${BASE_URL}/applications/status/${applicationId}`,
            { status: 'Shortlisted' },
            { headers: { Authorization: `Bearer ${recruiterToken}` } }
        );
        console.log(`✅ PASS: Status updated successfully via PUT request.`);

        // --- 12. Verify Persistence in MongoDB ---
        console.log('\n[TEST 12] Verifying status persistence in MongoDB...');
        const Application = require('./models/Application');
        const persistedApp = await Application.findById(applicationId);
        if (persistedApp && persistedApp.status === 'Shortlisted') {
            console.log(`✅ PASS: Application status 'Shortlisted' verified and persisted in MongoDB.`);
        } else {
            console.error(`❌ FAIL: Status was not updated or not persisted in MongoDB. Status found: ${persistedApp?.status}`);
        }

    } catch (error) {
        console.error('❌ AN UNEXPECTED EXCEPTION OCCURRED DURING TESTING:', error.response?.data || error.message);
    } finally {
        // Cleanup created documents
        console.log('\n--- CLEANING UP TEST DATA ---');
        try {
            if (candidateId) {
                const User = require('./models/User');
                await User.findByIdAndDelete(candidateId);
                await User.findByIdAndDelete(recruiterId);
                console.log('- Deleted test users.');

                const AcademicProfile = require('./models/AcademicProfile');
                await AcademicProfile.deleteMany({ candidateId });
                console.log('- Deleted test academic profiles.');
            }
            if (jobId) {
                const Job = require('./models/Job');
                await Job.findByIdAndDelete(jobId);
                console.log('- Deleted test jobs.');
            }
            if (resumeId) {
                const Resume = require('./models/Resume');
                await Resume.findByIdAndDelete(resumeId);
                console.log('- Deleted test resumes.');
            }
            if (applicationId) {
                const Application = require('./models/Application');
                await Application.findByIdAndDelete(applicationId);
                console.log('- Deleted test applications.');
            }
        } catch (cleanupErr) {
            console.error('Error during cleanup:', cleanupErr.message);
        }
        await mongoose.connection.close();
        console.log('\n--- TESTS COMPLETED ---');
    }
}

runTests();
