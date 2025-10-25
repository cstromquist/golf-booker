#!/usr/bin/env node

/**
 * Lomas Santa Fe Golf Course Booking Bot
 * 
 * This script uses the recorded Playwright actions to book a tee time
 * at Lomas Santa Fe Executive Golf Course with intelligent fallback 
 * from 4 players down to 1 player
 */

// Load environment variables from .env file
require('dotenv').config();

const { chromium } = require('playwright');

async function runSmartBooking(targetDate = null) {
    console.log('🚀 Starting Smart Golf Booking Bot...');
    
    // Validate required environment variables BEFORE opening browser
    const requiredVars = ['GOLF_EMAIL', 'GOLF_PASSWORD', 'CREDIT_CARD', 'CVV', 'BILLING_ADDRESS', 'POSTAL_CODE'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
        console.error(`\nPlease set these in your .env file or export them:`);
        missingVars.forEach(v => console.error(`export ${v}="your_value_here"`));
        console.error(`\nOr run: ./scripts/setup_env.sh`);
        process.exit(1);
    }
    
    let bookingSuccessful = false;
    
    // Get target date from command line argument or environment
    const finalTargetDate = targetDate || process.env.TARGET_DATE || '2025-10-31';
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(finalTargetDate)) {
        console.error('❌ Invalid date format. Please use YYYY-MM-DD (e.g., 2025-10-31)');
        process.exit(1);
    }
    
    // Configuration - All personal data from environment variables
    const config = {
        email: process.env.GOLF_EMAIL,
        password: process.env.GOLF_PASSWORD,
        creditCard: process.env.CREDIT_CARD,
        cvv: process.env.CVV,
        billingAddress: process.env.BILLING_ADDRESS,
        postalCode: process.env.POSTAL_CODE,
        targetDate: finalTargetDate
    };
    
    const browser = await chromium.launch({ 
        headless: false, // Set to true for production
        slowMo: 1000    // Slow down for visibility
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        
        console.log(`📅 Target Date: ${config.targetDate}`);
        console.log(`👤 Email: ${config.email}`);
        
        // Player count preferences (try in order)
        const playerCounts = [4, 3, 2, 1];
        
        // Navigate to booking page with target date in URL
        // Use the target date for the URL (format: YYYY-MM-DD)
        const urlDate = config.targetDate;
        await page.goto(`https://lomas-santa-fe-executive-golf-course.book.teeitup.com/teetimes?course=1241&date=${urlDate}&holes=18&max=999999`);
        console.log(`✅ Navigated to booking page for date: ${config.targetDate}`);
        
        // Login
        await page.getByTestId('core-login-signup').click();
        await page.getByTestId('login-email-component').fill(config.email);
        await page.getByTestId('login-password-component').fill(config.password);
        await page.getByTestId('login-button').click();
        console.log('✅ Logged in successfully');
        
        // Wait for login to complete and page to redirect with the target date
        await page.waitForTimeout(5000);
        
        // Check for "No Results!" message first
        try {
            await page.waitForSelector('[data-testid="no-records-found-header"]', { timeout: 5000 });
            console.log('❌ No tee times available for the selected date');
            console.log(`📅 Date: ${config.targetDate}`);
            console.log('💡 Try a different date or check back later');
            return;
        } catch (error) {
            // No "No Results!" message found, continue to check for tee times
            console.log('✅ No "No Results" message found, checking for tee times...');
        }
        
        // Check for available tee times
        let teeTimeButtons;
        try {
            await page.waitForSelector('[data-testid="teetimes_choose_rate_button"]', { timeout: 10000 });
            teeTimeButtons = await page.locator('[data-testid="teetimes_choose_rate_button"]').all();
            console.log(`Found ${teeTimeButtons.length} available tee times`);
            
            if (teeTimeButtons.length === 0) {
                console.log('❌ No tee times available for the selected date');
                console.log(`📅 Date: ${config.targetDate}`);
                console.log('💡 Try a different date or check back later');
                return;
            }
        } catch (error) {
            console.log('❌ No tee times found for the selected date');
            console.log(`📅 Date: ${config.targetDate}`);
            console.log('💡 This could mean:');
            console.log('   - No tee times are available for this date');
            console.log('   - The date is too far in the future');
            console.log('   - The date is in the past');
            console.log('   - Try a different date');
            return;
        }
        
        // If we get here, we have tee times available
        console.log('✅ Tee times found, proceeding with booking...');
        
        // Click on the first (earliest) tee time
        await teeTimeButtons[0].click();
        console.log('✅ Selected earliest tee time');
        
        // Try each player count until we find one that works
        let finalPlayerCount = null;
        
        for (const playerCount of playerCounts) {
            console.log(`\n🎯 Trying to book for ${playerCount} player(s)...`);
            
            try {
                // Wait for the booking form to load
                await page.waitForTimeout(1000);
                
                // Check if this player count is available
                const playerCountSelector = `[data-testid="golfer-select-radio-${playerCount}"]`;
                const playerCountElement = page.locator(playerCountSelector);
                
                if (!(await playerCountElement.isVisible()) || !(await playerCountElement.isEnabled())) {
                    console.log(`❌ ${playerCount} players option not available`);
                    continue;
                }
                
                console.log(`✅ ${playerCount} players option is available`);
                
                // Select this player count
                await playerCountElement.check();
                console.log(`✅ Selected ${playerCount} players`);
                
                // Add to cart
                await page.getByTestId('add-to-cart-button').click();
                console.log(`✅ Added ${playerCount} players to cart`);
                
                // Proceed to checkout
                await page.getByTestId('shopping-cart-drawer-checkout-btn').click();
                console.log('✅ Proceeded to checkout');
                
                // Fill payment information
                console.log('💳 Filling payment information...');
                
                // Fill credit card number
                await page.getByTestId('credit-card-number').click();
                await page.getByTestId('credit-card-number').fill(config.creditCard);
                console.log('✅ Credit card number filled');
                
                // Fill expiration month
                await page.getByTestId('credit-card-exp-month').getByRole('combobox').click();
                await page.getByRole('option', { name: '12' }).click();
                console.log('✅ Expiration month selected');
                
                // Fill expiration year
                await page.getByTestId('credit-card-exp-year').getByRole('combobox').click();
                await page.getByRole('option', { name: '2027' }).click();
                console.log('✅ Expiration year selected');
                
                // Fill CVV
                await page.getByRole('textbox', { name: 'CVV' }).click();
                await page.getByRole('textbox', { name: 'CVV' }).fill(config.cvv);
                console.log('✅ CVV filled');
                
                // Fill billing address
                await page.getByRole('textbox', { name: 'Billing Address' }).click();
                await page.getByRole('textbox', { name: 'Billing Address' }).fill(config.billingAddress);
                console.log('✅ Billing address filled');
                
                // Fill postal code
                await page.getByRole('textbox', { name: 'Postal Code' }).click();
                await page.getByRole('textbox', { name: 'Postal Code' }).fill(config.postalCode);
                console.log('✅ Postal code filled');
                
                // Select country
                await page.getByRole('combobox', { name: 'Opens list of countries for' }).click();
                await page.getByRole('option', { name: 'United States' }).click();
                console.log('✅ Country selected');
                
                // Agree to terms
                await page.getByRole('checkbox', { name: 'I agree to the Terms and' }).check();
                console.log('✅ Terms agreed');
                
                console.log('✅ Payment information filled');
                
                // Complete the booking
                console.log('🏁 Completing booking...');
                await page.getByTestId('make-your-reservation-btn').click();
                console.log('✅ Booking submitted!');
                
                // Wait for confirmation
                try {
                    await page.waitForURL('**/confirmation**', { timeout: 10000 });
                    console.log('✅ Booking confirmed!');
                } catch (error) {
                    console.log('⚠️ Could not verify confirmation page, but booking may have succeeded');
                }
                
                bookingSuccessful = true;
                finalPlayerCount = playerCount;
                break;
                
            } catch (error) {
                console.log(`❌ Failed to book for ${playerCount} players: ${error.message}`);
                
                // If this wasn't the last option, try to go back
                if (playerCount !== playerCounts[playerCounts.length - 1]) {
                    try {
                        console.log('🔄 Going back to try next player count...');
                        await page.goBack();
                        await page.waitForTimeout(1000);
                    } catch (e) {
                        console.log('Could not go back, continuing...');
                    }
                }
            }
        }
        
        if (bookingSuccessful) {
            console.log(`\n🎉 SUCCESS! Booked tee time for ${finalPlayerCount} player(s)`);
            console.log(`📅 Date: ${config.targetDate}`);
            console.log(`👥 Players: ${finalPlayerCount}`);
            console.log(`⏰ Time: Earliest available`);
        } else {
            console.log('\n❌ FAILED: Could not book for any player count');
            throw new Error('No available tee times for any player count');
        }
        
    } catch (error) {
        console.error('\n❌ Booking failed:', error.message);
        throw error;
    } finally {
        // Only keep browser open if booking was successful
        if (bookingSuccessful) {
            console.log('\n⏳ Keeping browser open for 30 seconds to verify booking...');
            await new Promise(resolve => setTimeout(resolve, 30000));
        } else {
            console.log('\n⏳ Closing browser...');
        }
        
        if (browser) {
            await browser.close();
        }
    }
}

// Run the booking
if (require.main === module) {
    // Get target date from command line arguments
    const args = process.argv.slice(2);
    const targetDate = args[0];
    
    if (!targetDate) {
        console.log(`
🏌️ Smart Golf Booking Bot

Usage:
  node src/playwright/run_smart_booking.js [DATE]

Examples:
  node src/playwright/run_smart_booking.js 2025-10-31
  node src/playwright/run_smart_booking.js 2025-11-15
  node src/playwright/run_smart_booking.js 2025-12-25

Date format: YYYY-MM-DD
        `);
        process.exit(1);
    }
    
    runSmartBooking(targetDate).catch(error => {
        console.error('Booking failed:', error);
        process.exit(1);
    });
}

module.exports = { runSmartBooking };
