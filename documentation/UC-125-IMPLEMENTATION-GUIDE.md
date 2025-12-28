# UC-125: Multi-Platform Application Tracker - Implementation Guide

## Overview
This feature allows users to track job applications across multiple platforms (LinkedIn, Indeed, Glassdoor, etc.), automatically detect duplicate applications, and merge them to keep their tracker organized.

## Implementation Complete ✅

### 1. Database Schema (`backend/sql/create_platform_tracking_tables.sql`)

**New Tables:**
- `application_platforms`: Tracks which platform each application came from
  - Fields: platform, platform_job_id, application_url, notes, applied_at
  - One job can have multiple platform entries
  
- `job_duplicates`: Tracks potential duplicate jobs
  - Fields: job_id_1, job_id_2, similarity_score, status (pending/merged/dismissed)
  - Includes similarity breakdown (company, title, location, date matches)

**Extended Jobs Table:**
- `primary_platform`: Main platform for the job
- `platform_count`: Number of platforms this job appears on
- `is_duplicate`: Boolean flag for duplicate jobs
- `merged_into_job_id`: Reference to master job if merged

**To Execute:**
1. Open Supabase SQL Editor
2. Copy and paste the contents of `backend/sql/create_platform_tracking_tables.sql`
3. Execute the script
4. Verify tables are created successfully

### 2. Backend Implementation

#### DTOs
- `AddPlatformDto`: Validation for adding platforms to jobs
- `MergeDuplicatesDto`: Validation for merging duplicate jobs

#### Services
**PlatformsService** (`backend/src/platforms/platforms.service.ts`):
- `addPlatformToJob()`: Add a platform to existing job
- `getJobPlatforms()`: Get all platforms for a job
- `getAllJobsWithPlatforms()`: Get all jobs with platform details
- `removePlatform()`: Remove a platform from job
- `updatePlatform()`: Update platform details

**DuplicateDetectionService** (`backend/src/duplicates/duplicate-detection.service.ts`):
- `findPotentialDuplicates()`: Detect duplicates for a job using similarity algorithm
- `calculateSimilarity()`: Calculate similarity score (0.0-1.0)
  - Company name: 40% weight
  - Job title: 35% weight
  - Location: 15% weight
  - Date proximity: 10% weight
- `getPendingDuplicates()`: Get all pending duplicates for user
- `mergeDuplicates()`: Merge multiple jobs into master job
- `dismissDuplicate()`: Dismiss a duplicate suggestion

#### Controllers
- **PlatformsController**: REST endpoints for platform management
  - POST `/platforms/job/:jobId` - Add platform
  - GET `/platforms/job/:jobId` - Get platforms for job
  - GET `/platforms/jobs/all` - Get all jobs with platforms
  - PATCH `/platforms/:platformId` - Update platform
  - DELETE `/platforms/:platformId` - Remove platform

- **DuplicatesController**: REST endpoints for duplicate management
  - POST `/duplicates/detect/:jobId` - Detect duplicates for job
  - GET `/duplicates/pending` - Get pending duplicates
  - POST `/duplicates/merge` - Merge duplicates
  - POST `/duplicates/dismiss/:id` - Dismiss duplicate

#### Modules
- `PlatformsModule`: Configured and added to AppModule
- `DuplicatesModule`: Configured and added to AppModule

### 3. Frontend Implementation

#### Components

**AddPlatformModal** (`frontend/src/components/AddPlatformModal.jsx`):
- Modal for adding platforms to jobs
- Platform selection dropdown (11 platforms)
- Optional fields: application URL, platform job ID, notes
- Validation and error handling

**DuplicateAlert** (`frontend/src/components/DuplicateAlert.jsx`):
- Displays potential duplicate jobs
- Shows similarity scores and match breakdown
- Allows selection of duplicates to merge
- Master job selection for merge target
- Individual dismiss functionality

**JobCardWithPlatforms** (`frontend/src/components/JobCardWithPlatforms.jsx`):
- Enhanced job card showing platform badges
- Color-coded platform indicators
- Links to external applications
- "Add Platform" button for quick access

#### Pages

**DuplicatesPage** (`frontend/src/pages/DuplicatesPage.jsx`):
- Dedicated page for managing duplicates
- Lists all pending duplicate suggestions
- Merge and dismiss functionality
- Refresh button to re-scan for duplicates
- Info box explaining duplicate detection algorithm

#### Updated Components

**JobForm** (`frontend/src/components/JobForm.jsx`):
- Added platform selection field
- Optional platform selection when creating jobs
- Platform automatically added after job creation

**Jobs.jsx** (`frontend/src/pages/Jobs.jsx`):
- Updated `handleCreate()` to add platform if selected
- Automatic duplicate detection after job creation
- Integration ready for JobCardWithPlatforms component

**Navbar** (`frontend/src/components/Navbar.jsx`):
- Added "Manage Duplicates" link in Jobs dropdown menu

#### Routes (`frontend/src/main.jsx`):
- Added `/jobs/duplicates` route for DuplicatesPage

### 4. Platform Options

Supported platforms:
- LinkedIn
- Indeed
- Glassdoor
- ZipRecruiter
- Monster
- CareerBuilder
- Dice
- Company Website
- Handshake
- AngelList/Wellfound
- Other

### 5. Duplicate Detection Algorithm

**Similarity Calculation:**
- Uses Dice coefficient for fuzzy string matching
- Weighted scoring system:
  - Company name: 40%
  - Job title: 35%
  - Location: 15%
  - Date proximity: 10%

**Threshold:**
- Jobs with ≥70% similarity are flagged as potential duplicates
- Similarity scores stored in job_duplicates table

**Merge Process:**
1. User selects duplicates to merge
2. User chooses master job (keeps this one)
3. All platforms from duplicate jobs are moved to master
4. Duplicate jobs are marked with `is_duplicate=true`
5. Duplicate records are marked as `merged`

## User Workflow

### Adding Platforms to Jobs

**Option 1: During Job Creation**
1. Fill out job form
2. Select platform from dropdown
3. Save job
4. Platform is automatically added
5. Duplicate detection runs automatically

**Option 2: After Job Creation**
1. View job in Jobs page
2. Click "Add Platform" button on job card
3. Fill out platform details in modal
4. Save platform

### Managing Duplicates

1. Navigate to Jobs → Manage Duplicates
2. Review list of potential duplicates
3. For each duplicate group:
   - Check similarity score
   - Review match breakdown
   - Select duplicates to merge
   - Choose master job
   - Click "Merge X Jobs"
4. Or dismiss false positives

## API Examples

### Add Platform to Job
```bash
POST /platforms/job/{jobId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "platform": "linkedin",
  "application_url": "https://linkedin.com/jobs/view/123",
  "platform_job_id": "123456",
  "notes": "Applied through quick apply"
}
```

### Detect Duplicates
```bash
POST /duplicates/detect/{jobId}
Authorization: Bearer {token}
```

### Merge Duplicates
```bash
POST /duplicates/merge
Authorization: Bearer {token}
Content-Type: application/json

{
  "masterJobId": "uuid-of-master",
  "duplicateJobIds": ["uuid-1", "uuid-2"]
}
```

## Testing Checklist

### Backend Tests
- [ ] Add platform to job
- [ ] Get platforms for job
- [ ] Remove platform from job
- [ ] Detect duplicates (create 2 similar jobs)
- [ ] Merge duplicates
- [ ] Dismiss duplicate
- [ ] Verify RLS policies work correctly

### Frontend Tests
- [ ] Create job with platform selected
- [ ] Add platform to existing job via modal
- [ ] View platform badges on job cards
- [ ] Navigate to Duplicates page
- [ ] View duplicate suggestions
- [ ] Merge duplicates
- [ ] Dismiss duplicates
- [ ] Verify platform links open correctly

### Integration Tests
- [ ] Create job → platform added → duplicates detected
- [ ] Merge jobs → platforms consolidated
- [ ] Multiple platforms on one job display correctly
- [ ] Duplicate detection runs for new jobs

## Next Steps

1. **Execute SQL Schema**: Run the SQL file in Supabase
2. **Restart Backend**: To load new modules
3. **Test Platform Addition**: Create a job with a platform
4. **Create Test Duplicates**: Add 2-3 similar jobs to test detection
5. **Test Merge**: Use Duplicates page to merge test jobs
6. **Verify**: Check all platforms moved to master job

## Optional Enhancements

Future improvements you could add:
- Bulk platform import from CSV
- Platform-specific status tracking
- Automated platform detection from URL
- Weekly duplicate scan reminders
- Analytics dashboard for platform performance
- Export platform data
- Platform-specific application templates

## Troubleshooting

**Issue: Duplicates not detected**
- Check similarity threshold (currently 70%)
- Verify at least 2 jobs exist with similar details
- Check backend logs for errors

**Issue: Platform not added**
- Verify job ownership
- Check for existing platform (only one per type per job)
- Check backend logs

**Issue: Merge fails**
- Verify all jobs belong to user
- Check job IDs are valid UUIDs
- Ensure master job exists

## Files Created/Modified

### Backend (New Files)
- `backend/sql/create_platform_tracking_tables.sql`
- `backend/src/platforms/dto/add-platform.dto.ts`
- `backend/src/platforms/platforms.service.ts`
- `backend/src/platforms/platforms.controller.ts`
- `backend/src/platforms/platforms.module.ts`
- `backend/src/duplicates/dto/merge-duplicates.dto.ts`
- `backend/src/duplicates/duplicate-detection.service.ts`
- `backend/src/duplicates/duplicates.controller.ts`
- `backend/src/duplicates/duplicates.module.ts`

### Backend (Modified Files)
- `backend/src/app.module.ts` - Added new modules

### Frontend (New Files)
- `frontend/src/components/AddPlatformModal.jsx`
- `frontend/src/components/DuplicateAlert.jsx`
- `frontend/src/components/JobCardWithPlatforms.jsx`
- `frontend/src/pages/DuplicatesPage.jsx`

### Frontend (Modified Files)
- `frontend/src/components/JobForm.jsx` - Added platform selection
- `frontend/src/pages/Jobs.jsx` - Updated handleCreate for platforms
- `frontend/src/components/Navbar.jsx` - Added Duplicates link
- `frontend/src/main.jsx` - Added /jobs/duplicates route

## Summary

The Multi-Platform Application Tracker is now fully implemented with:
✅ Database schema with RLS policies
✅ Backend services with duplicate detection algorithm
✅ REST API endpoints
✅ Frontend components and pages
✅ Integration with existing job tracker
✅ Navigation and routing

All that's left is to execute the SQL schema in Supabase and start using the feature!
