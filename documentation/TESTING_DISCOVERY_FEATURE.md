# Contact Discovery Feature - Testing Guide

## Current Status
✅ Frontend now shows "Suggested Connections" section (even when empty)
✅ Backend API is running at http://localhost:3000
✅ Frontend is running at http://localhost:5174

## How to Test the Feature

### Option 1: Quick Visual Test (Recommended)

1. **Refresh your page** at http://localhost:5173/networking/contacts
2. You should now see a **"Suggested Connections"** section with a message:
   - If no suggestions: Shows a blue gradient box explaining how suggestions work
   - If suggestions exist: Shows suggestion cards

### Option 2: Test the API Directly

Open your browser console (F12) and run:

```javascript
// Test if the API is working
fetch('http://localhost:3000/discovery/suggestions', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(data => {
  console.log('Suggestions API Response:', data);
  console.log('Number of suggestions:', data.length);
});
```

Expected response:
- `[]` (empty array) if no connections exist
- Array of suggestion objects if data exists

### Option 3: Add Test Data

Since you're the only user with contacts, you can:

1. **Create connections between your existing contacts**
   - Go to Supabase SQL Editor
   - Run the query from `backend/sql/quick_test_discovery.sql`
   - This will link your contacts to each other

2. **Steps to add test connections:**
   ```sql
   -- First, get your contact IDs
   SELECT id, full_name FROM professional_contacts 
   WHERE user_id = (SELECT id FROM users WHERE email = 'YOUR_EMAIL');
   
   -- Then link them (replace with actual IDs)
   INSERT INTO contact_connections (contact_id, connected_contact_id, connection_strength)
   VALUES 
     ('CONTACT_1_ID', 'CONTACT_2_ID', 4),
     ('CONTACT_2_ID', 'CONTACT_3_ID', 5)
   ON CONFLICT DO NOTHING;
   ```

3. **Refresh the page** - You should see suggestions appear!

## What You Should See Now

### Empty State (Current):
```
✨ Suggested Connections
[Blue gradient box with:]
"No Suggestions Yet
Add more contacts and their connections to get personalized 
connection suggestions based on mutual contacts, shared industries, 
and target companies."

ℹ️ Suggestions are based on 2nd-degree connections
🎯 Scored by industry match & mutual connections
```

### With Suggestions:
```
✨ Suggested Connections [3 new]
[Grid of suggestion cards showing:]
- Contact name, headline, company
- Score badge (colored by score)
- Mutual connections count
- Connection path preview
- Buttons: View Details, Connect, Ignore
```

## Testing Checklist

- [ ] Can see "Suggested Connections" section on the page
- [ ] Section shows "No Suggestions Yet" message when empty
- [ ] Can click "Refresh" button to reload suggestions
- [ ] API endpoint responds at `/discovery/suggestions`
- [ ] After adding test data: Suggestions appear as cards
- [ ] Clicking "View Details" opens connection path modal
- [ ] Clicking "Connect" opens contact form with pre-filled data
- [ ] Clicking "Ignore" removes suggestion from list

## Troubleshooting

### "Section still not visible"
- Clear browser cache (Ctrl + Shift + R)
- Check that frontend is running on correct port
- Verify you're logged in (check localStorage.getItem('token'))

### "API returns error"
- Check backend console for errors
- Verify database tables exist:
  - contact_connections
  - user_target_companies
  - contact_suggestions_tracking

### "No suggestions appear after adding data"
- Run the verification query in Supabase
- Check that connections are between different user's contacts
- Refresh the suggestions using the "Refresh" button

## How the Feature Works

1. **System finds your 1st-degree connections** (your contacts)
2. **Looks at their connections** (2nd-degree)
3. **Filters out** people you already know
4. **Scores each suggestion**:
   - Base: 1 point
   - Same industry: +1
   - Has mutual connections: +1
   - Works at target company: +1
5. **Ranks by score** and shows top suggestions

## Next Steps

1. Add more contacts to your account
2. Create connections between contacts using the SQL scripts
3. (Optional) Add target companies to improve scoring
4. Invite other users to test the full network effect
