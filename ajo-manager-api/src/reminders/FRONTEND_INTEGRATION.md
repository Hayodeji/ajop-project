# WhatsApp Reminders - Frontend Integration Guide

This guide explains how to integrate WhatsApp reminder functionality in the frontend.

## Manual Reminder Trigger

### Endpoint
```
POST /reminders/group/{groupId}
Authorization: Bearer <auth-token>
```

### Response
```typescript
{
  success: boolean;
  sent: number;          // Count of reminders successfully sent
  noPhone: number;       // Count of members without phone numbers
  totalPending: number;  // Total pending contributions
}
```

### Example Usage

**JavaScript/TypeScript**
```typescript
// In your API client (lib/api.ts or similar)
export const sendReminders = async (groupId: string) => {
  const response = await fetch(`/reminders/group/${groupId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to send reminders')
  }

  return response.json()
}

// In your component
import { sendReminders } from '@/lib/api'
import { toast } from 'sonner' // or your toast library

const handleSendReminders = async (groupId: string) => {
  try {
    const result = await sendReminders(groupId)
    
    if (result.sent > 0) {
      toast.success(
        `Reminders sent to ${result.sent} member${result.sent !== 1 ? 's' : ''}`
      )
    }
    
    if (result.noPhone > 0) {
      toast.warning(
        `${result.noPhone} member${result.noPhone !== 1 ? 's' : ''} don't have phone numbers`
      )
    }
  } catch (error) {
    toast.error('Failed to send reminders')
    console.error(error)
  }
}
```

**React Hook Example**
```typescript
import { useMutation } from '@tanstack/react-query'
import { sendReminders } from '@/lib/api'
import { toast } from 'sonner'

export const useSendReminders = (groupId: string) => {
  return useMutation({
    mutationFn: () => sendReminders(groupId),
    onSuccess: (result) => {
      if (result.sent > 0) {
        toast.success(
          `✓ Reminders sent to ${result.sent} member${result.sent !== 1 ? 's' : ''}`
        )
      }
      
      if (result.noPhone > 0) {
        toast.warning(
          `⚠ ${result.noPhone} member${result.noPhone !== 1 ? 's' : ''} ` +
          `${result.noPhone !== 1 ? 'don' : 'doesn'}t have phone numbers`
        )
      }
    },
    onError: () => {
      toast.error('Failed to send reminders. Please try again.')
    },
  })
}

// Usage in component
function GroupActions({ group }: { group: Group }) {
  const { mutate: sendReminders, isPending } = useSendReminders(group.id)

  return (
    <button
      onClick={() => sendReminders()}
      disabled={isPending}
      className="btn btn-primary"
    >
      {isPending ? 'Sending...' : '📱 Send WhatsApp Reminders'}
    </button>
  )
}
```

## UI Components

### Button Component
```tsx
<button
  onClick={() => sendReminders(groupId)}
  disabled={loading}
  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
>
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    {/* WhatsApp icon */}
  </svg>
  {loading ? 'Sending...' : 'Send WhatsApp Reminders'}
</button>
```

### Status Display
```tsx
{result && (
  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
    <p className="font-semibold text-blue-900">Reminder Status</p>
    <ul className="mt-2 space-y-1 text-sm text-blue-800">
      <li>✓ Sent: {result.sent}/{result.totalPending}</li>
      {result.noPhone > 0 && (
        <li>⚠ No phone: {result.noPhone}</li>
      )}
    </ul>
  </div>
)}
```

## Error Handling

```typescript
const sendReminders = async (groupId: string) => {
  try {
    const result = await fetch(`/reminders/group/${groupId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (result.status === 403) {
      throw new Error('You do not have permission to send reminders for this group')
    }

    if (result.status === 404) {
      throw new Error('Group not found')
    }

    if (!result.ok) {
      throw new Error('Failed to send reminders')
    }

    return result.json()
  } catch (error) {
    console.error('Reminder error:', error)
    throw error
  }
}
```

## Permissions

Only the group admin can send reminders. The endpoint requires:
- Valid authentication token (Bearer token)
- User must be the group owner/admin

## Rate Limiting Considerations

Currently, manual reminders can be sent at any time. Consider adding:
- UI-level debouncing (prevent rapid clicks)
- Server-side rate limiting (1 per minute per group)
- Confirmation dialog for large groups

```typescript
// Add debounce to prevent rapid clicks
import { debounce } from 'lodash'

const debouncedSendReminders = debounce(
  async (groupId: string) => {
    await sendReminders(groupId)
  },
  1000, // Wait 1 second between calls
  { leading: true, trailing: false }
)
```

## Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Reminders sent |
| 400 | Bad Request | Invalid groupId |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Not group admin |
| 404 | Not Found | Group doesn't exist |
| 500 | Server Error | API error |

## Webhook Integration (Optional)

If you want to show real-time updates:

```typescript
// Listen to real-time reminder logs via WebSocket
const setupReminderListener = (groupId: string) => {
  const channel = supabase
    .channel(`reminders:${groupId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'reminder_logs',
      },
      (payload) => {
        console.log('New reminder log:', payload)
        // Update UI with real-time status
      }
    )
    .subscribe()

  return () => channel.unsubscribe()
}
```

## Best Practices

1. **Show Confirmation**: Warn admin if many members don't have phone numbers
2. **Disable During Errors**: Disable button if WhatsApp API is not configured
3. **Show Count**: Display how many members will receive reminders
4. **Success Feedback**: Show toast/alert after sending
5. **Loading State**: Show loading spinner while sending
6. **Mobile-Friendly**: Ensure button is accessible on mobile

## Automatic Reminders

Users don't need to take action for automatic reminders. The system automatically sends:
- Reminders 2 days before due date (daily at 7 AM)
- Reminders 2 days after due date (daily at 7 AM)
- Payment confirmations when admin marks contribution as paid

These happen automatically without manual intervention.
