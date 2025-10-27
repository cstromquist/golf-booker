# JC Golf Tee Time Checker

This script automatically checks for available tee times before 7:00 AM using the JC Golf API and sends email notifications when early tee times are found.

## Features

- ✅ Checks for tee times before 7:00 AM
- ✅ Searches up to 14 days ahead
- ✅ **Detailed summary logging** with course breakdown and statistics
- ✅ **Optional email notifications** (works without email configuration)
- ✅ **Easy viewing tools** (`npm run view-summary`)
- ✅ Comprehensive error handling and logging
- ✅ Configurable bearer token and parameters
- ✅ Designed for cron job execution (every 5 minutes)
- ✅ Sends error notifications if authentication fails

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Run the setup script
./scripts/setup_tee_time_checker.sh

# Edit the .env file with your credentials
nano .env
```

### 3. Required Environment Variables

**Required for automatic token management:**
```bash
# JC Golf Login Credentials (REQUIRED)
JC_GOLF_USERNAME=your_email@gmail.com
JC_GOLF_PASSWORD=your_password
```

**Optional (For email notifications):**
```bash
# Email Configuration
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_TO=chris.stromquist@gmail.com

# Additional Configuration (optional)
COURSE_IDS=22,6
CLASS_CODE=JCPWE
MEMBER_STORE_ID=5
```

**Note:** The `JC_GOLF_BEARER_TOKEN` is automatically managed by the script and will be added to your .env file when you first run `npm run refresh-token`.

### 4. Available NPM Scripts

```bash
# Check for early tee times
npm run check-tee-times

# View latest detailed summary
npm run view-summary

# Setup the tee time checker
npm run setup-tee-checker
```

### 5. Set Up Your JC Golf Credentials

1. Add your JC Golf login credentials to the `.env` file:
   ```bash
   JC_GOLF_USERNAME=your_email@gmail.com
   JC_GOLF_PASSWORD=your_password
   ```

2. Run the token refresh to get your first bearer token:
   ```bash
   npm run refresh-token
   ```

**Note:** The script will automatically manage bearer tokens for you - no manual token copying needed!

### 6. Set Up Gmail App Password (Optional)

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Security → 2-Step Verification → App passwords
3. Generate a password for "Mail"
4. Use this password as `EMAIL_PASS` in your .env file

## Usage

### Quick Start (No Email Required)

The script works perfectly without email configuration and provides detailed logging:

```bash
# Check for early tee times
npm run check-tee-times

# View detailed summary
npm run view-summary

# Check the detailed log
cat logs/tee-time-summary.log
```

### Test the Script

```bash
node src/scripts/jc_golf_tee_time_checker.js
```

### Set Up Cron Job

To run every 5 minutes:

```bash
crontab -e
```

Add this line:
```bash
*/5 * * * * cd /path/to/golf-booker && node src/scripts/jc_golf_tee_time_checker.js >> logs/cron.log 2>&1
```

### View Results

The script creates detailed summaries in `logs/tee-time-summary.log` including:
- Total early tee times found
- Course breakdown
- Day-by-day details with exact times
- Player counts and rates

## Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_TEE_TIME` | 7 | Maximum hour (24-hour format) to consider "early" |
| `SEARCH_DAYS_AHEAD` | 14 | Number of days ahead to search |
| `COURSE_IDS` | 22,6 | Comma-separated course IDs to search |
| `CLASS_CODE` | JCPWE | Your membership class code |
| `MEMBER_STORE_ID` | 5 | Your member store ID |

## Logs

- **Application logs**: `logs/tee-time-checker.log`
- **Cron logs**: `logs/cron.log`
- **Console output**: Real-time status updates

## Email Notifications

### Success Notification
When early tee times are found, you'll receive an email with:
- Date of available tee times
- Course name
- Time (formatted as 12-hour)
- Player count range
- Rate type

### Error Notification
If the script encounters errors (like expired bearer token), you'll receive an email with:
- Error details
- Timestamp
- Stack trace
- Instructions to check logs

## Troubleshooting

### Common Issues

1. **Authentication Error (401)**
   - Bearer token has expired
   - Get a new token from the JC Golf website

2. **Email Not Sending**
   - Check Gmail App Password is correct
   - Ensure 2-Factor Authentication is enabled
   - Check Gmail security settings

3. **No Tee Times Found**
   - This is normal - the script only notifies when early times are available
   - Check logs to see what dates were searched

4. **Network Errors**
   - Check internet connection
   - Verify JC Golf website is accessible
   - Check firewall settings

### Debug Mode

To see detailed logs, check the log files:
```bash
tail -f logs/tee-time-checker.log
```

## API Details

The script uses the JC Golf API endpoint:
```
GET https://jcplayer5.cps.golf/onlineres/onlineapi/api/v1/onlinereservation/TeeTimes
```

With the following parameters:
- `searchDate`: Date in "Sun Oct 26 2025" format
- `courseIds`: Comma-separated course IDs
- `teeOffTimeMin`: 0 (start of day)
- `teeOffTimeMax`: 23 (end of day)
- `classCode`: Your membership class
- `memberStoreId`: Your store ID

## Security Notes

- Never commit your `.env` file to version control
- Keep your bearer token secure
- Use Gmail App Passwords instead of your main password
- Regularly rotate your bearer token

## Support

If you encounter issues:
1. Check the logs in `logs/tee-time-checker.log`
2. Verify all environment variables are set correctly
3. Test the bearer token manually with a tool like Postman
4. Ensure your Gmail credentials are working
