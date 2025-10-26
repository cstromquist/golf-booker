#!/usr/bin/env node

/**
 * JC Golf Tee Time Checker - OAuth2 Version
 * 
 * This version uses OAuth2 instead of App passwords for Gmail authentication
 * which is more secure and doesn't require App passwords.
 */

// Load environment variables from .env file
require('dotenv').config();

const axios = require('axios');
const { google } = require('googleapis');
const winston = require('winston');
const moment = require('moment');

// Configure logging
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/tee-time-checker.log' }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Configuration - All values from environment variables
const config = {
    // API Configuration
    apiBaseUrl: 'https://jcplayer5.cps.golf/onlineres/onlineapi/api/v1/onlinereservation',
    bearerToken: process.env.JC_GOLF_BEARER_TOKEN,
    
    // Email Configuration (OAuth2)
    emailUser: process.env.EMAIL_USER,
    emailTo: process.env.EMAIL_TO || 'chris.stromquist@gmail.com',
    
    // OAuth2 Configuration
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    
    // Search Configuration
    maxTeeTime: 7, // 7 AM in 24-hour format
    searchDaysAhead: 14, // Search up to 14 days ahead
    courseIds: process.env.COURSE_IDS || '22,6', // Default to Crossings and another course
    classCode: process.env.CLASS_CODE || 'JCPWE',
    memberStoreId: process.env.MEMBER_STORE_ID || '5',
    
    // Request Headers (from Postman collection)
    headers: {
        'x-componentid': '1',
        'x-ismobile': 'false',
        'x-moduleid': '7',
        'x-productid': '1',
        'x-requestid': '96b844c1-571a-d18c-d36f-a2de49222917',
        'x-siteid': '16',
        'x-terminalid': '3',
        'x-timezone-offset': '420',
        'x-timezoneid': 'America/Los_Angeles',
        'Authorization': process.env.JC_GOLF_BEARER_TOKEN,
        'Content-Type': 'application/json'
    }
};

// Validate required environment variables
function validateConfig() {
    const requiredVars = ['JC_GOLF_BEARER_TOKEN', 'EMAIL_USER', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
        logger.error('Please set these in your .env file:');
        missingVars.forEach(v => logger.error(`export ${v}="your_value_here"`));
        process.exit(1);
    }
}

// Create OAuth2 client and get access token
async function getAccessToken() {
    try {
        const oauth2Client = new google.auth.OAuth2(
            config.clientId,
            config.clientSecret,
            'urn:ietf:wg:oauth:2.0:oob'
        );
        
        oauth2Client.setCredentials({
            refresh_token: config.refreshToken
        });
        
        const { token } = await oauth2Client.getAccessToken();
        return token;
    } catch (error) {
        logger.error('Failed to get OAuth2 access token:', error);
        throw error;
    }
}

// Send email notification using OAuth2
async function sendEmailNotification(teeTimes, searchDate) {
    try {
        const accessToken = await getAccessToken();
        
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        
        const subject = `🏌️ Early Tee Times Found - ${searchDate}`;
        const htmlContent = `
            <h2>🏌️ Early Tee Times Available!</h2>
            <p><strong>Date:</strong> ${searchDate}</p>
            <p><strong>Found ${teeTimes.length} early tee time(s) before 7:00 AM:</strong></p>
            <ul>
                ${teeTimes.map(teeTime => `
                    <li>
                        <strong>${teeTime.courseName}</strong><br>
                        Time: ${moment(teeTime.startTime).format('h:mm A')}<br>
                        Players: ${teeTime.minPlayer}-${teeTime.maxPlayer}<br>
                        Rate: ${teeTime.defaultBookingRate.bookingRateTypeName}
                    </li>
                `).join('')}
            </ul>
            <p><em>This notification was sent by your JC Golf Tee Time Checker.</em></p>
        `;
        
        const message = {
            to: config.emailTo,
            subject: subject,
            html: htmlContent
        };
        
        const result = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: Buffer.from(
                    `To: ${message.to}\r\n` +
                    `Subject: ${message.subject}\r\n` +
                    `Content-Type: text/html; charset=UTF-8\r\n` +
                    `\r\n` +
                    message.html
                ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
            }
        });
        
        logger.info(`Email notification sent successfully to ${config.emailTo}`);
        
    } catch (error) {
        logger.error('Failed to send email notification:', error);
        throw error;
    }
}

// Send error notification email
async function sendErrorNotification(error, searchDate) {
    try {
        const accessToken = await getAccessToken();
        
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        
        const subject = `❌ JC Golf Tee Time Checker Error - ${searchDate}`;
        const htmlContent = `
            <h2>❌ Tee Time Checker Error</h2>
            <p><strong>Date:</strong> ${searchDate}</p>
            <p><strong>Error:</strong> ${error.message}</p>
            <p><strong>Time:</strong> ${moment().format('YYYY-MM-DD HH:mm:ss')}</p>
            <pre>${error.stack}</pre>
            <p><em>Please check the logs and update the bearer token if it has expired.</em></p>
        `;
        
        const message = {
            to: config.emailTo,
            subject: subject,
            html: htmlContent
        };
        
        const result = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: Buffer.from(
                    `To: ${message.to}\r\n` +
                    `Subject: ${message.subject}\r\n` +
                    `Content-Type: text/html; charset=UTF-8\r\n` +
                    `\r\n` +
                    message.html
                ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
            }
        });
        
        logger.info(`Error notification sent successfully to ${config.emailTo}`);
        
    } catch (emailError) {
        logger.error('Failed to send error notification email:', emailError);
    }
}

// Check for tee times on a specific date
async function checkTeeTimesForDate(searchDate) {
    try {
        logger.info(`Checking tee times for date: ${searchDate}`);
        
        // Format date for API (e.g., "Sun Oct 26 2025")
        const formattedDate = moment(searchDate).format('ddd MMM DD YYYY');
        
        const params = {
            searchDate: formattedDate,
            holes: '0',
            numberOfPlayer: '0',
            courseIds: config.courseIds,
            searchTimeType: '0',
            teeOffTimeMin: '0',
            teeOffTimeMax: '23', // Search all times, we'll filter for early times
            isChangeTeeOffTime: 'true',
            teeSheetSearchView: '5',
            classCode: config.classCode,
            defaultOnlineRate: 'N',
            isUseCapacityPricing: 'false',
            memberStoreId: config.memberStoreId,
            searchType: '1'
        };
        
        const response = await axios.get(`${config.apiBaseUrl}/TeeTimes`, {
            headers: config.headers,
            params: params,
            timeout: 30000 // 30 second timeout
        });
        
        if (response.status !== 200) {
            throw new Error(`API returned status ${response.status}`);
        }
        
        const teeTimes = response.data;
        logger.info(`Found ${teeTimes.length} total tee times for ${searchDate}`);
        
        // Filter for tee times before 7 AM
        const earlyTeeTimes = teeTimes.filter(teeTime => {
            const startTime = moment(teeTime.startTime);
            const hour = startTime.hour();
            return hour < config.maxTeeTime;
        });
        
        logger.info(`Found ${earlyTeeTimes.length} early tee times (before 7 AM)`);
        
        return earlyTeeTimes;
        
    } catch (error) {
        if (error.response) {
            // API error response
            logger.error(`API Error: ${error.response.status} - ${error.response.statusText}`);
            logger.error('Response data:', error.response.data);
            
            if (error.response.status === 401) {
                throw new Error('Authentication failed - Bearer token may be expired');
            } else if (error.response.status === 403) {
                throw new Error('Access forbidden - Check bearer token permissions');
            }
        } else if (error.request) {
            // Network error
            logger.error('Network error - no response received');
            throw new Error('Network error - unable to reach JC Golf API');
        } else {
            // Other error
            logger.error('Request setup error:', error.message);
            throw error;
        }
    }
}

// Main function to check for early tee times
async function checkForEarlyTeeTimes() {
    logger.info('🚀 Starting JC Golf Tee Time Checker (OAuth2)...');
    
    try {
        validateConfig();
        
        const today = moment();
        const earlyTeeTimesFound = [];
        let authErrorOccurred = false;
        
        // Check the next 14 days for early tee times
        for (let i = 0; i < config.searchDaysAhead; i++) {
            const searchDate = today.clone().add(i, 'days').format('YYYY-MM-DD');
            
            try {
                const earlyTeeTimes = await checkTeeTimesForDate(searchDate);
                
                if (earlyTeeTimes.length > 0) {
                    logger.info(`✅ Found ${earlyTeeTimes.length} early tee times for ${searchDate}`);
                    earlyTeeTimesFound.push({
                        date: searchDate,
                        teeTimes: earlyTeeTimes
                    });
                } else {
                    logger.info(`❌ No early tee times found for ${searchDate}`);
                }
                
                // Delay between requests to respect API rate limits (3 requests per second)
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                logger.error(`Error checking date ${searchDate}:`, error.message);
                
                // If we get a 401 error, stop checking other dates since they'll all fail
                if (error.message.includes('Authentication failed') || error.message.includes('401')) {
                    logger.error('Authentication failed - stopping further checks. Please update your bearer token.');
                    authErrorOccurred = true;
                    break;
                }
                
                // For rate limiting, add extra delay and continue
                if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
                    logger.warn('Rate limited - waiting 5 seconds before continuing...');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        }
        
        // Send notification if early tee times were found
        if (earlyTeeTimesFound.length > 0) {
            logger.info(`🎉 Found early tee times on ${earlyTeeTimesFound.length} day(s)!`);
            
            for (const dayResult of earlyTeeTimesFound) {
                await sendEmailNotification(dayResult.teeTimes, dayResult.date);
            }
        } else if (authErrorOccurred) {
            logger.error('❌ Check failed due to authentication error. Please update your JC_GOLF_BEARER_TOKEN in the .env file.');
        } else {
            logger.info('No early tee times found in the next 14 days');
        }
        
        logger.info('✅ Tee time check completed successfully');
        
    } catch (error) {
        logger.error('❌ Tee time check failed:', error);
        
        // Send error notification
        try {
            await sendErrorNotification(error, moment().format('YYYY-MM-DD'));
        } catch (emailError) {
            logger.error('Failed to send error notification:', emailError);
        }
        
        throw error;
    }
}

// Run the checker
if (require.main === module) {
    checkForEarlyTeeTimes().catch(error => {
        logger.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { checkForEarlyTeeTimes, checkTeeTimesForDate };
