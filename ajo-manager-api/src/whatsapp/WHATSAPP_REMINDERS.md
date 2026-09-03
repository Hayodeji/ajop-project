# WhatsApp Payment Reminders

This document describes the WhatsApp payment reminder system for AjoPot.

## Overview

The system sends automatic WhatsApp messages to group members to remind them about upcoming or overdue contributions. Messages are sent via the Meta Cloud API (WhatsApp Business API).

## Features

- **Automated Daily Reminders**: Cron job runs at 7 AM daily to send reminders to members
  - "Due in 2 days" reminder to members with upcoming due dates
  - "2 days overdue" reminder to members who haven't paid
- **Payment Confirmation**: When an admin marks a contribution as paid, a confirmation message is sent to the member
- **Manual Group Reminders**: Admin can trigger reminders for a specific group on-demand via `POST /reminders/group/:groupId`
- **Deduplication**: Prevents sending duplicate reminders within 24 hours to the same member
- **Delivery Logging**: All reminder attempts (sent/failed) are logged to the `reminder_logs` database table
- **Smart Filtering**: Only sends reminders to groups with active Smart or Pro subscription plans

## Architecture

### Core Components

**`WhatsAppService`** (`src/whatsapp/whatsapp.service.ts`)
- Centralized WhatsApp messaging service
- Handles phone number normalization
- Manages API communication with Meta Cloud API
- Logs all reminders to database
- Used by: `RemindersService`, `MembersService`, `SubscriptionsCron`, `ContributionsService`

**`RemindersService`** (`src/reminders/reminders.service.ts`)
- Scheduled cron jobs for daily reminders (`@Cron('0 7 * * *')`)
- Sends "due in 2 days" and "overdue" reminders
- Manual reminder trigger for group admins
- Integrates deduplication logic

**`RemindersRepo`** (`src/reminders/reminders.repo.ts`)
- Queries contributions based on due dates and status
- Filters by subscription plan (Smart/Pro only)
- Handles date range calculations

**`ContributionsService`** (`src/contributions/contributions.service.ts`)
- Sends payment confirmation when contribution is marked as paid
- Only admin can mark contributions as paid

## Configuration

### Environment Variables

```bash
# Meta Cloud API endpoint (v19.0 or later)
WHATSAPP_API_URL=https://graph.instagram.com/v19.0

# Your WhatsApp Business API token (with whatsapp_business_messaging permission)
WHATSAPP_API_TOKEN=EAA...your-token...

# Your WhatsApp Business Phone Number ID
WHATSAPP_PHONE_ID=1234567890123456

# Webhook verification token (for receiving incoming messages)
WHATSAPP_VERIFY_TOKEN=your-secure-token-here
```

### Setup Steps

1. **Create Meta Business Account** (if not already done)
   - Go to https://www.facebook.com/business
   - Complete verification process

2. **Create WhatsApp Business App**
   - Use Meta App Dashboard
   - Add WhatsApp product to your app
   - Complete setup and get your Phone Number ID

3. **Get API Token**
   - Go to App Roles > System User
   - Create or select a system user
   - Generate token with `whatsapp_business_messaging` permission

4. **Configure Webhook**
   - In Meta App Dashboard, go to WhatsApp > Configuration
   - Set Webhook URL to: `https://your-domain.com/webhook/whatsapp`
   - Set Verify Token to your `WHATSAPP_VERIFY_TOKEN`
   - Subscribe to message webhook

5. **Database Setup**
   - `reminder_logs` table (auto-created via migration 0006)
   - Stores all reminder send attempts with timestamps and status

## API Endpoints

### Manual Reminder Trigger
```bash
POST /reminders/group/:groupId
Authorization: Bearer <user-token>

Response:
{
  "success": true,
  "sent": 15,           # Messages successfully sent
  "noPhone": 2,         # Members without phone number
  "totalPending": 17    # Total pending contributions
}
```

## Message Templates

### Upcoming Reminder (2 days before)
```
Hi {name} 👋, just a reminder that your contribution for *{group_name}* 
(Cycle {cycle_number}) is due in *2 days*. Please make payment on time to 
avoid late charges. — AjoPot
```

### Overdue Reminder (2+ days after due date)
```
Hi {name}, your contribution for *{group_name}* (Cycle {cycle_number}) 
was due 2 days ago and is still unpaid. Please make payment as soon as 
possible to avoid late fees. — AjoPot
```

### Manual Reminder
```
Hi {name} 👋, this is a reminder from your Ajo admin to contribute to 
*{group_name}* (Cycle {cycle_number}). Please make payment as soon as 
possible. — AjoPot
```

### Payment Confirmation
```
Hi {name} 👋, thanks for paying ₦{amount} for *{group_name}* 
(Cycle {cycle_number}). Your payment has been confirmed. — AjoPot
```

### Member Onboarding
```
Hi {name}, you've been added to the '{group_name}' ajo group by {admin_name} 
on AjoPot.
Your contribution: ₦{amount} {frequency}.
Your collection position: #{position}.
```

### Subscription Trial Ending
```
Hi {name}, your AjoPot free trial ends tomorrow. Your {plan} plan will be 
activated and ₦{amount} charged to your saved card. Questions? Reply to this message.
```

## Deduplication Logic

The system checks `reminder_logs` table before sending a reminder to a member:
- If a successful reminder was sent to the same phone in the last 24 hours, it's skipped
- This prevents spam and duplicate reminders
- Each reminder attempt is logged regardless of deduplication

## Database Schema

### reminder_logs Table
```sql
CREATE TABLE reminder_logs (
  id UUID PRIMARY KEY,
  recipient TEXT NOT NULL,           -- Phone number or identifier
  message TEXT NOT NULL,             -- Full message body
  channel TEXT DEFAULT 'whatsapp',   -- 'whatsapp', 'sms', etc.
  status TEXT DEFAULT 'sent',        -- 'sent', 'failed', 'pending'
  error_message TEXT,                -- Error details if status='failed'
  sent_at TIMESTAMP DEFAULT NOW()    -- When reminder was sent
);

CREATE INDEX idx_reminder_logs_recipient_sent_at 
  ON reminder_logs(recipient, sent_at DESC);
```

## Error Handling

- **Missing API Config**: Logs warning and skips sending (reminders disabled)
- **Invalid Phone Number**: Logs and skips member
- **API Errors**: Logs error details, marks as failed in `reminder_logs`
- **Network Issues**: Axios automatically retries (configurable)

## Monitoring & Debugging

### Check Recent Reminders
```sql
SELECT recipient, status, message, sent_at, error_message
FROM reminder_logs
WHERE sent_at > NOW() - INTERVAL '24 hours'
ORDER BY sent_at DESC
LIMIT 50;
```

### Check Reminders for Specific Member
```sql
SELECT channel, status, sent_at, error_message
FROM reminder_logs
WHERE recipient = '+2349123456789'
ORDER BY sent_at DESC
LIMIT 20;
```

### Monitor Failed Sends
```sql
SELECT COUNT(*), status
FROM reminder_logs
WHERE sent_at > NOW() - INTERVAL '1 day'
GROUP BY status;
```

## Testing

Run tests with:
```bash
npm test -- src/whatsapp/whatsapp.service.spec.ts
```

Test coverage includes:
- Successful message sending
- API configuration validation
- Phone number normalization
- Error handling
- Database logging

## Troubleshooting

### Reminders Not Sending
1. Check `WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_ID` are set
2. Verify subscription plan is "smart" or "pro" (Basic plan excluded)
3. Check member phone number is set and valid
4. Review `reminder_logs` for error details

### Messages Not Received by Members
1. Verify Meta webhook is properly configured
2. Check Meta App Dashboard > Logs for API errors
3. Ensure sender phone number is verified with Meta
4. Check member phone number format (should be 11+ digits without +)

### Too Many/Duplicate Messages
1. Deduplication checks last 24 hours
2. If needed, adjust in `WhatsAppService.hasRecentReminder()`
3. Check manual reminders aren't being triggered repeatedly

## Security

- API tokens stored in environment variables (never in code)
- Phone numbers are stripped of + before sending (as per Meta API spec)
- Webhook verification token validates incoming requests
- All operations require admin authentication on API endpoints

## Future Enhancements

- [ ] Configurable reminder schedules per group
- [ ] WhatsApp interactive message buttons for quick payment confirmation
- [ ] SMS fallback for members without WhatsApp
- [ ] Reminder analytics dashboard
- [ ] Per-member message preferences (opt-in/out)
- [ ] Support for incoming payment confirmations via WhatsApp replies
