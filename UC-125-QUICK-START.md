# UC-125: Multi-Platform Application Tracker - Quick Start Guide

## 🚀 Getting Started

### Step 1: Execute SQL Schema

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project
3. Go to **SQL Editor**
4. Open the file: `backend/sql/create_platform_tracking_tables.sql`
5. Copy the entire SQL content
6. Paste into SQL Editor
7. Click **Run**
8. Verify success message appears

### Step 2: Restart Backend Server

```powershell
# Navigate to backend directory
cd backend

# Install any missing dependencies
npm install

# Restart the server
npm run start:dev
```

### Step 3: Test the Feature

#### Test 1: Add Platform When Creating Job

1. Navigate to http://localhost:5173/jobs
2. Click "Add New Job" button
3. Fill out job form:
   - Job Title: "Software Engineer"
   - Company: "Tech Corp"
   - **Platform: Select "LinkedIn"** (new field)
4. Click Save
5. Verify:
   - Job appears in list
   - Platform badge shows "LinkedIn"
   - No errors in console

#### Test 2: Add Platform to Existing Job

1. Find any job in the jobs list
2. Click "Add Platform" button
3. In the modal:
   - Select platform (e.g., "Indeed")
   - Optional: Add application URL
   - Optional: Add notes
4. Click "Add Platform"
5. Verify:
   - Platform badge appears on job card
   - Modal closes
   - No errors

#### Test 3: Create Duplicate Jobs

1. Create Job 1:
   - Title: "Senior Developer"
   - Company: "Microsoft"
   - Location: "Seattle, WA"
   - Platform: "LinkedIn"

2. Create Job 2:
   - Title: "Senior Software Developer"
   - Company: "Microsoft Corp"
   - Location: "Seattle"
   - Platform: "Indeed"

3. Wait a few seconds for duplicate detection

#### Test 4: View and Merge Duplicates

1. Navigate to **Jobs → Manage Duplicates** (in navbar)
2. You should see the two jobs flagged as potential duplicates
3. Review the similarity score (should be >70%)
4. Check the boxes for the duplicate jobs
5. Select one as the "master job"
6. Click "Merge X Jobs"
7. Verify:
   - Jobs are merged
   - Master job now shows both platforms (LinkedIn + Indeed)
   - Duplicate job no longer appears in jobs list

## 📊 Feature Overview

### What You Can Do

✅ **Track Multiple Platforms**
- Add platforms when creating jobs
- Add platforms to existing jobs
- View all platforms for each job
- Remove platforms if needed

✅ **Automatic Duplicate Detection**
- Runs automatically when creating jobs
- Uses smart algorithm (company, title, location, date)
- Shows similarity scores and breakdown
- Detects jobs across different platforms

✅ **Merge Duplicates**
- Select multiple duplicates
- Choose master job to keep
- All platforms consolidated
- Duplicate jobs marked and hidden

✅ **Platform Management**
- 11 supported platforms
- Color-coded badges
- Links to external applications
- Track application URLs and notes

### Supported Platforms

1. **LinkedIn** - Blue badge
2. **Indeed** - Green badge
3. **Glassdoor** - Teal badge
4. **ZipRecruiter** - Purple badge
5. **Monster** - Pink badge
6. **CareerBuilder** - Orange badge
7. **Dice** - Red badge
8. **Company Website** - Gray badge
9. **Handshake** - Indigo badge
10. **AngelList** - Yellow badge
11. **Other** - Gray badge

## 🔍 How It Works

### Duplicate Detection Algorithm

The system calculates a similarity score based on:

- **Company Name** (40% weight)
  - Normalized string comparison
  - Ignores punctuation and case
  - Fuzzy matching

- **Job Title** (35% weight)
  - Similar normalization
  - Matches partial titles

- **Location** (15% weight)
  - City, state, country matching
  - Handles variations (e.g., "Seattle" vs "Seattle, WA")

- **Application Date** (10% weight)
  - Linear decay over 30 days
  - Same-day applications score highest

**Threshold**: Jobs with ≥70% similarity are flagged as duplicates

### Merge Process

When you merge duplicates:
1. All platforms from duplicate jobs → master job
2. Duplicate jobs marked with `is_duplicate = true`
3. Duplicate records marked as `merged`
4. Platform count updated on master job
5. Duplicate jobs hidden from job list

## 🎯 Use Cases

### Use Case 1: Job Seeker Applying to Multiple Platforms
**Scenario**: You find the same job on LinkedIn and Indeed

**Steps**:
1. Apply on LinkedIn → Create job with "LinkedIn" platform
2. Apply on Indeed → System detects duplicate
3. Navigate to Duplicates page
4. Review and merge both applications
5. One job entry now shows both platforms

### Use Case 2: Tracking Application Sources
**Scenario**: Want to know which platforms lead to interviews

**Steps**:
1. Add platform to each job when created
2. Update job status as you progress
3. View analytics (future feature) to see platform performance
4. Focus efforts on most successful platforms

### Use Case 3: Avoiding Double Applications
**Scenario**: Not sure if you've already applied to a company

**Steps**:
1. Start creating job application
2. Fill out company and title
3. Check Duplicates page
4. See if similar job exists
5. Either merge or confirm it's different

## 🐛 Troubleshooting

### Issue: Platform not showing after adding
**Fix**: 
- Refresh the page
- Check browser console for errors
- Verify backend is running on port 3000

### Issue: Duplicates not detected
**Fix**:
- Check similarity threshold (≥70%)
- Verify job details are similar enough
- Try manually triggering detection:
  ```bash
  POST http://localhost:3000/duplicates/detect/{jobId}
  ```

### Issue: Cannot merge duplicates
**Fix**:
- Verify you selected a master job
- Check that jobs belong to you
- Look for errors in backend logs

### Issue: SQL errors when executing schema
**Fix**:
- Make sure you're in the correct Supabase project
- Check if tables already exist
- Try dropping existing tables first (if testing):
  ```sql
  DROP TABLE IF EXISTS application_platforms CASCADE;
  DROP TABLE IF EXISTS job_duplicates CASCADE;
  ```

## 📝 API Endpoints

### Platforms

```bash
# Add platform to job
POST /platforms/job/:jobId
Body: { "platform": "linkedin", "application_url": "...", "notes": "..." }

# Get platforms for job
GET /platforms/job/:jobId

# Get all jobs with platforms
GET /platforms/jobs/all

# Update platform
PATCH /platforms/:platformId
Body: { "notes": "Updated notes" }

# Remove platform
DELETE /platforms/:platformId
```

### Duplicates

```bash
# Detect duplicates for job
POST /duplicates/detect/:jobId

# Get all pending duplicates
GET /duplicates/pending

# Merge duplicates
POST /duplicates/merge
Body: { "masterJobId": "...", "duplicateJobIds": ["...", "..."] }

# Dismiss duplicate
POST /duplicates/dismiss/:duplicateId
```

## 💡 Tips & Best Practices

1. **Add platforms immediately when applying**
   - Helps with tracking
   - Enables duplicate detection
   - Better analytics later

2. **Review duplicates weekly**
   - Keeps job list clean
   - Easier to manage applications
   - Better overview of opportunities

3. **Use application URLs**
   - Quick access to original posting
   - Reference for follow-ups
   - Track multiple versions

4. **Add notes to platforms**
   - Note which resume version used
   - Track recruiter names
   - Record application method

5. **Don't dismiss duplicates too quickly**
   - Review similarity score
   - Check if truly different roles
   - Consider merging similar positions

## 🎨 UI Components

### AddPlatformModal
- Clean modal interface
- Platform dropdown
- Optional fields
- Validation and error handling

### DuplicateAlert
- Similarity visualization
- Match breakdown
- Batch selection
- Master job selection

### JobCardWithPlatforms
- Colored platform badges
- External links
- Quick add button
- Clean integration

### DuplicatesPage
- Full-page management
- Sorting by similarity
- Bulk operations
- Info boxes

## 🚀 Next Steps

After testing:
1. ✅ Use the feature regularly when adding jobs
2. ✅ Review duplicates page weekly
3. ✅ Add platforms to existing jobs
4. ✅ Provide feedback on similarity threshold
5. ✅ Suggest additional platforms to support

## 📚 Additional Resources

- **Implementation Guide**: See `UC-125-IMPLEMENTATION-GUIDE.md`
- **Backend Code**: `backend/src/platforms/` and `backend/src/duplicates/`
- **Frontend Code**: `frontend/src/components/` and `frontend/src/pages/`
- **SQL Schema**: `backend/sql/create_platform_tracking_tables.sql`

---

**Need Help?** Check the implementation guide or backend logs for more details.
