#!/usr/bin/env node

/**
 * JC Golf Token Fetcher
 * 
 * This script automatically fetches a fresh bearer token from JC Golf
 * and updates the .env file with the new token.
 */

// Load environment variables from .env file
require('dotenv').config();

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration from curl request
const tokenConfig = {
    url: 'https://jcplayer5.cps.golf/identityapi/connect/token',
    headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9,fr;q=0.8,pt;q=0.7',
        'cache-control': 'no-cache, no-store, must-revalidate',
        'client-id': 'onlineresweb',
        'content-type': 'application/x-www-form-urlencoded',
        'expires': 'Sat, 01 Jan 2000 00:00:00 GMT',
        'if-modified-since': '0',
        'origin': 'https://jcplayer5.cps.golf',
        'pragma': 'no-cache',
        'priority': 'u=1, i',
        'referer': 'https://jcplayer5.cps.golf/onlineresweb/search-teetime?TeeOffTimeMin=0&TeeOffTimeMax=23.999722222222225',
        'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        'x-apikey': '8ea2914e-cac2-48a7-a3e5-e0f41350bf3a',
        'x-componentid': '1',
        'x-ismobile': 'false',
        'x-moduleid': '7',
        'x-productid': '1',
        'x-requestid': 'f2c46ca6-3eb7-7378-9443-86a863943f96',
        'x-siteid': '16',
        'x-terminalid': '3',
        'x-timezone-offset': '420',
        'x-timezoneid': 'America/Los_Angeles',
        'x-websiteid': 'a347a421-5a62-46ca-8ecd-08d8d810c321'
    },
    data: {
        grant_type: 'password',
        scope: 'openid profile onlinereservation sale inventory sh customer email recommend references',
        username: process.env.JC_GOLF_USERNAME,
        password: process.env.JC_GOLF_PASSWORD,
        client_id: 'js1',
        client_secret: 'v4secret'
    }
};

// Function to update .env file with new token
function updateEnvFile(token) {
    const envPath = path.join(process.cwd(), '.env');
    
    try {
        let envContent = '';
        
        // Read existing .env file if it exists
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }
        
        // Check if JC_GOLF_BEARER_TOKEN already exists
        const tokenRegex = /^JC_GOLF_BEARER_TOKEN=.*$/m;
        
        if (tokenRegex.test(envContent)) {
            // Update existing token
            envContent = envContent.replace(tokenRegex, `JC_GOLF_BEARER_TOKEN=Bearer ${token}`);
        } else {
            // Add new token
            if (envContent && !envContent.endsWith('\n')) {
                envContent += '\n';
            }
            envContent += `JC_GOLF_BEARER_TOKEN=Bearer ${token}\n`;
        }
        
        // Write updated content back to .env file
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Updated .env file with new bearer token');
        
    } catch (error) {
        console.error('❌ Failed to update .env file:', error.message);
        throw error;
    }
}

// Function to get fresh bearer token
async function getFreshToken() {
    try {
        console.log('🔄 Fetching fresh bearer token from JC Golf...');
        
        const response = await axios.post(tokenConfig.url, 
            new URLSearchParams(tokenConfig.data).toString(),
            {
                headers: tokenConfig.headers,
                timeout: 30000
            }
        );
        
        if (response.status !== 200) {
            throw new Error(`Token request failed with status ${response.status}`);
        }
        
        const tokenData = response.data;
        
        if (!tokenData.access_token) {
            throw new Error('No access token in response');
        }
        
        console.log('✅ Successfully obtained bearer token');
        console.log(`📅 Token expires in: ${tokenData.expires_in} seconds`);
        
        return tokenData.access_token;
        
    } catch (error) {
        if (error.response) {
            console.error('❌ Token request failed:', error.response.status, error.response.statusText);
            console.error('Response data:', error.response.data);
        } else if (error.request) {
            console.error('❌ Network error - no response received');
        } else {
            console.error('❌ Request setup error:', error.message);
        }
        throw error;
    }
}

// Validate required environment variables
function validateCredentials() {
    const requiredVars = ['JC_GOLF_USERNAME', 'JC_GOLF_PASSWORD'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
        console.error('Please set these in your .env file:');
        missingVars.forEach(v => console.error(`export ${v}="your_value_here"`));
        console.error('');
        console.error('Example .env entries:');
        console.error('JC_GOLF_USERNAME=your_email@gmail.com');
        console.error('JC_GOLF_PASSWORD=your_password');
        process.exit(1);
    }
}

// Main function
async function refreshToken() {
    try {
        validateCredentials();
        
        const token = await getFreshToken();
        updateEnvFile(token);
        
        console.log('🎉 Token refresh completed successfully!');
        console.log('💡 You can now run: npm run check-tee-times');
        
    } catch (error) {
        console.error('❌ Token refresh failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    refreshToken();
}

module.exports = { refreshToken, getFreshToken };
