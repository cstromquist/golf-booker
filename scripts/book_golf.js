#!/usr/bin/env node

/**
 * Golf Booking Wrapper Script
 * 
 * Simple wrapper for the smart golf booking bot
 * Usage: node scripts/book_golf.js [DATE]
 */

const { runSmartBooking } = require('../src/playwright/lomas_santa_fe_booking');

async function main() {
    const args = process.argv.slice(2);
    const targetDate = args[0];
    
    if (!targetDate) {
        console.log(`
🏌️ Golf Booking Bot

Usage:
  node scripts/book_golf.js [DATE]

Examples:
  node scripts/book_golf.js 2025-10-31
  node scripts/book_golf.js 2025-11-15
  node scripts/book_golf.js 2025-12-25

Date format: YYYY-MM-DD

This will:
1. Try to book for 4 players first
2. Fall back to 3 players if 4 not available
3. Fall back to 2 players if 3 not available  
4. Fall back to 1 player if 2 not available
5. Book the earliest available tee time
        `);
        process.exit(1);
    }
    
    try {
        await runSmartBooking(targetDate);
        console.log('\n🎉 Booking completed successfully!');
    } catch (error) {
        console.error('\n❌ Booking failed:', error.message);
        process.exit(1);
    }
}

main();
