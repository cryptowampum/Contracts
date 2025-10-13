// test-upload.js - Test your backend locally
// Usage: node test-upload.js path/to/image.jpg

const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

async function testUpload(imagePath) {
  try {
    console.log('🧪 Testing Pinata Upload Backend');
    console.log('================================\n');

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.error('❌ File not found:', imagePath);
      process.exit(1);
    }

    // Test health endpoint first
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    console.log('');

    // Read the file
    console.log('2️⃣ Reading test image...');
    const fileBuffer = fs.readFileSync(imagePath);
    const fileStats = fs.statSync(imagePath);
    console.log(`✅ File loaded: ${fileStats.size} bytes`);
    console.log('');

    // Create form data
    console.log('3️⃣ Uploading to backend...');
    const formData = new FormData();
    formData.append('image', fileBuffer, {
      filename: 'test-image.jpg',
      contentType: 'image/jpeg'
    });

    // Upload
    const uploadResponse = await axios.post(
      `${BACKEND_URL}/api/upload`,
      formData,
      {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    console.log('✅ Upload successful!\n');
    console.log('📊 Response:');
    console.log('  IPFS URL:', uploadResponse.data.ipfsUrl);
    console.log('  Gateway URL:', uploadResponse.data.gatewayUrl);
    console.log('  IPFS Hash:', uploadResponse.data.ipfsHash);
    console.log('  Size:', uploadResponse.data.size, 'bytes');
    console.log('');

    console.log('🎉 All tests passed!');
    console.log('');
    console.log('You can view your image at:');
    console.log(uploadResponse.data.gatewayUrl);
    
  } catch (error) {
    console.error('\n❌ Test failed!');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else if (error.request) {
      console.error('No response from server. Is it running?');
      console.error('Expected URL:', BACKEND_URL);
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
}

// Get image path from command line
const imagePath = process.argv[2];

if (!imagePath) {
  console.log('Usage: node test-upload.js <path-to-image>');
  console.log('Example: node test-upload.js test-image.jpg');
  process.exit(1);
}

testUpload(imagePath);