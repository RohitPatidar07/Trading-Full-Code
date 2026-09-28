const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const token = jwt.sign({ id: 1, username: 'superadmin', role: 'SUPERADMIN' }, process.env.JWT_SECRET || 'your_jwt_secret_key_123', { expiresIn: '1h' });
const client = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: 'Bearer ' + token },
    timeout: 5000
});

async function runTests() {
    console.log('============================================');
    console.log('   RUNNING INTERNAL TRANSFER TEST SUITE');
    console.log('============================================');
    
    // Check if backend is alive first
    try {
        await axios.get('http://localhost:5000/health', { timeout: 3000 });
    } catch(err) {
        console.error('\n❌ ERROR: Backend server is not running on http://localhost:5000!');
        console.error('Please make sure backend is started first: "npm run dev"\n');
        process.exit(1);
    }

    let passed = 0;
    let failed = 0;

    // Test 1: Negative amount
    try {
        console.log('\n[TEST 1] Testing negative amount: -500');
        await client.post('/portfolio/transfer', { toUserId: 12, amount: -500 });
        console.log('❌ FAIL: Negative amount was accepted!');
        failed++;
    } catch(e) {
        if (e.response?.status === 400 && e.response?.data?.message?.includes('positive number')) {
            console.log('✅ PASS: Rejected with 400 ->', e.response.data.message);
            passed++;
        } else {
            console.log('❌ FAIL unexpected response:', e.response?.status, e.response?.data);
            failed++;
        }
    }

    // Test 2: Zero amount
    try {
        console.log('\n[TEST 2] Testing zero amount: 0');
        await client.post('/portfolio/transfer', { toUserId: 12, amount: 0 });
        console.log('❌ FAIL: Zero amount was accepted!');
        failed++;
    } catch(e) {
        if (e.response?.status === 400) {
            console.log('✅ PASS: Rejected with 400 ->', e.response.data.message);
            passed++;
        } else {
            console.log('❌ FAIL unexpected response:', e.response?.status, e.response?.data);
            failed++;
        }
    }

    // Test 3: String/invalid amount
    try {
        console.log('\n[TEST 3] Testing non-numeric amount: "invalid_amount"');
        await client.post('/portfolio/transfer', { toUserId: 12, amount: 'invalid_amount' });
        console.log('❌ FAIL: Non-numeric amount was accepted!');
        failed++;
    } catch(e) {
        if (e.response?.status === 400) {
            console.log('✅ PASS: Rejected with 400 ->', e.response.data.message);
            passed++;
        } else {
            console.log('❌ FAIL unexpected response:', e.response?.status, e.response?.data);
            failed++;
        }
    }

    // Test 4: Transfer to oneself
    try {
        console.log('\n[TEST 4] Testing transfer to oneself: fromUserId 1 to toUserId 1');
        await client.post('/portfolio/transfer', { toUserId: 1, amount: 100 });
        console.log('❌ FAIL: Transfer to oneself accepted!');
        failed++;
    } catch(e) {
        if (e.response?.status === 400 && e.response?.data?.message?.includes('yourself')) {
            console.log('✅ PASS: Rejected with 400 ->', e.response.data.message);
            passed++;
        } else {
            console.log('❌ FAIL unexpected response:', e.response?.status, e.response?.data);
            failed++;
        }
    }

    // Test 5: Transfer to non-existent user
    try {
        console.log('\n[TEST 5] Testing transfer to non-existent user: 999999');
        await client.post('/portfolio/transfer', { toUserId: 999999, amount: 100 });
        console.log('❌ FAIL: Transfer to non-existent user accepted!');
        failed++;
    } catch(e) {
        if (e.response?.status === 400 && e.response?.data?.message?.includes('does not exist')) {
            console.log('✅ PASS: Rejected with 400 ->', e.response.data.message);
            passed++;
        } else {
            console.log('❌ FAIL unexpected response:', e.response?.status, e.response?.data);
            failed++;
        }
    }

    // Test 6: Valid transfer
    try {
        console.log('\n[TEST 6] Testing valid transfer of ₹50 to user 12');
        const r6 = await client.post('/portfolio/transfer', { toUserId: 12, amount: 50, notes: 'Automated verification test' });
        console.log('✅ PASS: Transfer succeeded! Response:', r6.data.message);
        passed++;
    } catch(e) {
        console.log('❌ FAIL: Valid transfer failed:', e.response?.status, e.response?.data);
        failed++;
    }

    console.log('\n============================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('============================================');
}

runTests();
