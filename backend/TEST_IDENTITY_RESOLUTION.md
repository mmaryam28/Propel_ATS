# Identity Resolution & Auto-Connection Testing

## What Was Implemented

The system now automatically:
1. **Identifies if a contact is a user** in the system (by email or LinkedIn URL)
2. **Populates `contact_connections`** automatically when a match is found
3. **Links to the user's network** - all their contacts become 2nd-degree connections for you

## How It Works

### Scenario: You add Nikoleta as a contact
1. You fill out the form with Nikoleta's email or LinkedIn URL
2. System checks if someone with that email/LinkedIn is registered as a user
3. If found, it creates connections in `contact_connections`:
   - Your Nikoleta contact → All of Nikoleta's contacts (Bill Gates, etc.)
4. Now Bill Gates appears as a suggestion (2nd-degree connection)

## Testing Steps

### Step 1: Check Current State
```sql
-- See your contacts
SELECT id, full_name, email, linkedin_profile_url
FROM professional_contacts
WHERE user_id = '06beccc4-cb51-4a3b-a6aa-7bc0e6fecee7';

-- See if Nikoleta is a user
SELECT id, email FROM users WHERE email LIKE '%nikoleta%';
```

### Step 2: Ensure Nikoleta is Registered as a User
For this to work, Nikoleta needs to be registered in the system. Check if user `32f37232-13c0-4837-8ec9-51f993fe9aa3` exists.

### Step 3: Trigger Sync for Existing Contacts
Call the sync endpoint to process all existing contacts:

```bash
# Using curl (replace with your auth token)
curl -X POST http://localhost:3000/contacts/sync-all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Or use Postman:
- Method: POST
- URL: http://localhost:3000/contacts/sync-all
- Headers: Authorization: Bearer YOUR_TOKEN

### Step 4: Verify Connections Were Created
```sql
-- Check if connections were created
SELECT 
  pc1.full_name as "Your Contact",
  pc2.full_name as "Is Connected To",
  cc.connection_strength
FROM contact_connections cc
JOIN professional_contacts pc1 ON cc.contact_id = pc1.id
JOIN professional_contacts pc2 ON cc.connected_contact_id = pc2.id
WHERE pc1.user_id = '06beccc4-cb51-4a3b-a6aa-7bc0e6fecee7';
```

### Step 5: Test Suggestions API
```bash
curl -X GET http://localhost:3000/discovery/suggestions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected result: Bill Gates should appear as a suggested contact!

## How to Add New Contacts Going Forward

Just add contacts normally through the UI form. The system will automatically:
1. Check if they're a registered user
2. Link to their network if found
3. Make their contacts visible as suggestions

## Matching Logic

The system matches contacts to users by:
1. **Email** (highest priority, most reliable)
2. **LinkedIn URL** (normalized matching: extracts username)

Examples:
- Email: `nikoleta@example.com` matches user with same email
- LinkedIn: `https://linkedin.com/in/nikoleta-sino-713a49292/` matches any format with username `nikoleta-sino-713a49292`

## Important Notes

1. **User Registration Required**: People must be registered users for their networks to be accessible
2. **Privacy**: Only links to networks of users who are in the system
3. **Automatic**: Works on both create and update of contacts
4. **Sync Endpoint**: Run `/contacts/sync-all` to retroactively process existing contacts

## Troubleshooting

If suggestions still don't work:

1. Verify Nikoleta is a registered user:
   ```sql
   SELECT * FROM users WHERE id = '32f37232-13c0-4837-8ec9-51f993fe9aa3';
   ```

2. Check if Nikoleta has contacts:
   ```sql
   SELECT * FROM professional_contacts 
   WHERE user_id = '32f37232-13c0-4837-8ec9-51f993fe9aa3';
   ```

3. Manually verify the email/LinkedIn matching:
   ```sql
   -- Your Nikoleta contact
   SELECT id, email, linkedin_profile_url 
   FROM professional_contacts 
   WHERE id = 'ffbba7b6-56b0-481f-aebf-fb7d99e05f7d';
   
   -- User Nikoleta's email/info
   SELECT id, email FROM users WHERE id = '32f37232-13c0-4837-8ec9-51f993fe9aa3';
   ```

4. If emails/LinkedIn don't match, update your Nikoleta contact:
   ```sql
   UPDATE professional_contacts 
   SET email = 'nikoleta@actual-email.com'  -- Use Nikoleta's real email
   WHERE id = 'ffbba7b6-56b0-481f-aebf-fb7d99e05f7d';
   ```
   
   Then run the sync endpoint again.
