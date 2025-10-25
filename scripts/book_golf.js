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
    let targetDate = args[0];
    
    // If no date provided, calculate the next Friday (7 days out)
    if (!targetDate) {
        const today = new Date();
        const nextFriday = new Date(today);
        
        // Calculate days until next Friday (Friday = 5)
        const currentDay = today.getDay();
        const daysUntilFriday = (5 - currentDay + 7) % 7;
        const daysToAdd = daysUntilFriday === 0 ? 7 : daysUntilFriday; // If today is Friday, get next Friday
        
        nextFriday.setDate(today.getDate() + daysToAdd);
        
        // Format as YYYY-MM-DD
        const year = nextFriday.getFullYear();
        const month = String(nextFriday.getMonth() + 1).padStart(2, '0');
        const day = String(nextFriday.getDate()).padStart(2, '0');
        targetDate = `${year}-${month}-${day}`;
        
        console.log(`📅 No date provided, automatically booking for next Friday: ${targetDate}`);
    }
    
    try {
        await runSmartBooking(targetDate);
        console.log('\n🎉 Booking completed successfully!');
    } catch (error) {
        console.error('\n❌ Booking failed:', error.message);
        process.exit(1);
    }
}

// Show help if script is run with --help or -h
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
🏌️ Golf Booking Bot

Usage:
  node scripts/book_golf.js [DATE]

Examples:
  node scripts/book_golf.js 2025-10-31    # Book for specific date
  node scripts/book_golf.js               # Book for next Friday (7 days out)

Date format: YYYY-MM-DD

This will:
1. Try to book for 4 players first
2. Fall back to 3 players if 4 not available
3. Fall back to 2 players if 3 not available  
4. Fall back to 1 player if 2 not available
5. Book the earliest available tee time

Automation:
- When run without a date, automatically books for the next Friday
- Perfect for cron jobs that run every Friday at midnight
- Example: If run on 10/24 at midnight, books for 10/31
    `);
    process.exit(0);
}

main();
