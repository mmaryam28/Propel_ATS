# UC-125: Multi-Platform Application Tracker

## Overview

The Multi-Platform Application Tracker is a comprehensive feature that allows job seekers to track their applications across multiple job platforms (LinkedIn, Indeed, Glassdoor, etc.), automatically detect duplicate applications, and merge them intelligently.

## Key Features

### 1. Multi-Platform Tracking
- Track which platform you used for each job application
- Support for 11 major job platforms
- Add multiple platforms to a single job
- Color-coded platform badges for quick identification
- Direct links to original job postings

### 2. Automatic Duplicate Detection
- Smart algorithm that detects similar job applications
- Weighted similarity scoring based on:
  - Company name (40%)
  - Job title (35%)
  - Location (15%)
  - Application date (10%)
- Fuzzy matching for company and title variations
- Threshold-based detection (70% or higher)

### 3. Intelligent Merging
- Select multiple duplicate jobs to merge
- Choose which job to keep as the master
- Automatically consolidates all platforms
- Preserves application history
- Marks duplicates for clean job list

### 4. User-Friendly Interface
- Add platforms during job creation
- Quick "Add Platform" button on job cards
- Dedicated Duplicates management page
- Visual similarity scores and breakdowns
- Batch operations for efficiency

## Architecture

### Database Schema

```
application_platforms
├── id (UUID, PK)
├── job_id (UUID, FK → jobs)
├── platform (VARCHAR)
├── platform_job_id (VARCHAR)
├── application_url (TEXT)
├── notes (TEXT)
├── applied_at (TIMESTAMP)
└── created_at/updated_at

job_duplicates
├── id (UUID, PK)
├── job_id_1 (UUID, FK → jobs)
├── job_id_2 (UUID, FK → jobs)
├── similarity_score (DECIMAL)
├── company_match (DECIMAL)
├── title_match (DECIMAL)
├── location_match (DECIMAL)
├── date_match (DECIMAL)
├── status (VARCHAR: pending/merged/dismissed)
├── merged_into_job_id (UUID, FK → jobs)
├── created_at (TIMESTAMP)
└── resolved_at (TIMESTAMP)

jobs (extended)
├── ... (existing fields)
├── primary_platform (VARCHAR)
├── platform_count (INTEGER)
├── is_duplicate (BOOLEAN)
└── merged_into_job_id (UUID)
```

### Backend Stack

- **NestJS**: RESTful API framework
- **Supabase/PostgreSQL**: Database and authentication
- **TypeScript**: Type-safe backend code
- **class-validator**: Request validation

**Key Services:**
- `PlatformsService`: Platform CRUD operations
- `DuplicateDetectionService`: Similarity algorithm and merging logic

**API Endpoints:**
- `POST /platforms/job/:jobId` - Add platform
- `GET /platforms/job/:jobId` - Get platforms
- `DELETE /platforms/:platformId` - Remove platform
- `POST /duplicates/detect/:jobId` - Detect duplicates
- `GET /duplicates/pending` - Get pending duplicates
- `POST /duplicates/merge` - Merge duplicates
- `POST /duplicates/dismiss/:id` - Dismiss duplicate

### Frontend Stack

- **React 18**: UI library
- **React Router**: Navigation
- **TailwindCSS**: Styling
- **Lucide Icons**: Icon library

**Key Components:**
- `AddPlatformModal`: Modal for adding platforms
- `DuplicateAlert`: Display and manage duplicates
- `JobCardWithPlatforms`: Enhanced job card with platform badges
- `DuplicatesPage`: Full duplicate management page

## Duplicate Detection Algorithm

### String Similarity (Dice Coefficient)

The algorithm uses the Dice coefficient for fuzzy string matching:

```
similarity = 2 * |intersection| / (|set1| + |set2|)
```

**Process:**
1. Normalize strings (lowercase, remove punctuation, trim)
2. Generate bigrams (2-character substrings)
3. Calculate intersection of bigrams
4. Return similarity score (0.0 to 1.0)

**Example:**
```
String 1: "Microsoft Corporation"
Normalized: "microsoft corporation"
Bigrams: ["mi", "ic", "cr", "ro", ...]

String 2: "Microsoft Corp"
Normalized: "microsoft corp"
Bigrams: ["mi", "ic", "cr", "ro", ...]

Similarity: 0.89 (89%)
```

### Weighted Scoring

Each component contributes to the final similarity score:

```
final_score = (company_score * 0.4) + 
              (title_score * 0.35) + 
              (location_score * 0.15) + 
              (date_score * 0.1)
```

**Company Match (40%):**
- Normalized string comparison
- Handles variations: "Microsoft" vs "Microsoft Corp" vs "Microsoft Corporation"

**Title Match (35%):**
- Similar normalization
- Matches: "Software Engineer" vs "Sr. Software Engineer" vs "Senior SWE"

**Location Match (15%):**
- Combines city, state, country
- Handles: "Seattle" vs "Seattle, WA" vs "Seattle, Washington"

**Date Match (10%):**
- Linear decay over 30 days
- Same day = 1.0, 30+ days = 0.0

### Threshold

Jobs with **similarity ≥ 70%** are flagged as potential duplicates.

## Installation

### 1. Database Setup

Execute the SQL schema:

```sql
-- In Supabase SQL Editor
-- Copy contents from: backend/sql/create_platform_tracking_tables.sql
```

### 2. Backend Setup

No additional dependencies needed - modules are already integrated.

```bash
cd backend
npm install
npm run start:dev
```

### 3. Frontend Setup

No additional dependencies needed - components are ready.

```bash
cd frontend
npm install
npm run dev
```

## Usage

### Creating Job with Platform

```javascript
// Frontend: JobForm component
const jobData = {
  title: "Software Engineer",
  company: "Tech Corp",
  platform: "linkedin", // New field
  // ... other fields
};

await createJob(jobData);
// Platform is automatically added
// Duplicate detection runs automatically
```

### Adding Platform to Existing Job

```javascript
// Frontend: AddPlatformModal component
const platformData = {
  platform: "indeed",
  application_url: "https://indeed.com/job/123",
  notes: "Applied with custom resume"
};

await fetch(`/platforms/job/${jobId}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(platformData)
});
```

### Detecting Duplicates

```javascript
// Automatic after job creation
// Or manual trigger:
await fetch(`/duplicates/detect/${jobId}`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Merging Duplicates

```javascript
// Frontend: DuplicatesPage component
const mergeData = {
  masterJobId: "uuid-of-job-to-keep",
  duplicateJobIds: ["uuid-1", "uuid-2", "uuid-3"]
};

await fetch('/duplicates/merge', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(mergeData)
});
```

## Testing

### Unit Tests (Recommended)

Create tests for:
- `PlatformsService.addPlatformToJob()`
- `DuplicateDetectionService.calculateSimilarity()`
- `DuplicateDetectionService.findPotentialDuplicates()`
- `DuplicateDetectionService.mergeDuplicates()`

### Integration Tests

1. Create job with platform → verify platform added
2. Create similar jobs → verify duplicates detected
3. Merge duplicates → verify platforms consolidated
4. Dismiss duplicate → verify record updated

### Manual Testing

See `backend/sql/test_duplicate_detection.sql` for SQL test script.

## API Documentation

### POST /platforms/job/:jobId

Add a platform to an existing job.

**Request:**
```json
{
  "platform": "linkedin",
  "application_url": "https://linkedin.com/jobs/view/123",
  "platform_job_id": "123456",
  "notes": "Applied through quick apply"
}
```

**Response:**
```json
{
  "id": "uuid",
  "job_id": "uuid",
  "platform": "linkedin",
  "application_url": "https://...",
  "platform_job_id": "123456",
  "notes": "...",
  "applied_at": "2024-01-15T10:30:00Z",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### POST /duplicates/detect/:jobId

Detect potential duplicates for a job.

**Response:**
```json
[
  {
    "id": "uuid",
    "job_title": "Senior Software Engineer",
    "company_name": "Microsoft Corp",
    "similarity_score": 0.87,
    "company_match": 0.92,
    "title_match": 0.85,
    "location_match": 1.0,
    "date_match": 0.8
  }
]
```

### POST /duplicates/merge

Merge duplicate jobs into a master job.

**Request:**
```json
{
  "masterJobId": "uuid-of-master",
  "duplicateJobIds": ["uuid-1", "uuid-2"]
}
```

**Response:**
```json
{
  "message": "Jobs merged successfully",
  "masterJobId": "uuid-of-master"
}
```

## Security

### Row Level Security (RLS)

All tables have RLS policies:

```sql
-- application_platforms
CREATE POLICY "Users can manage their own job platforms"
ON application_platforms FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = application_platforms.job_id 
    AND jobs.user_id = auth.uid()
  )
);

-- job_duplicates
CREATE POLICY "Users can view their own job duplicates"
ON job_duplicates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM jobs 
    WHERE (jobs.id = job_duplicates.job_id_1 OR jobs.id = job_duplicates.job_id_2)
    AND jobs.user_id = auth.uid()
  )
);
```

### API Authentication

All endpoints require JWT authentication via `JwtAuthGuard`.

### Data Validation

All DTOs use `class-validator` decorators:
- `@IsString()`, `@IsUUID()`, `@IsUrl()`, `@IsOptional()`

## Performance Considerations

### Database Indexes

```sql
-- Platform lookups
CREATE INDEX idx_application_platforms_job_id 
ON application_platforms(job_id);

-- Duplicate queries
CREATE INDEX idx_job_duplicates_status 
ON job_duplicates(status);

CREATE INDEX idx_job_duplicates_job1 
ON job_duplicates(job_id_1);
```

### Optimization Tips

1. **Batch Duplicate Detection**: Run on job creation or weekly batch
2. **Limit Search Scope**: Only check recent jobs (last 90 days)
3. **Cache Platform Counts**: Stored on jobs table for quick access
4. **Pagination**: Use pagination for large duplicate lists

## Future Enhancements

### Potential Features

1. **Platform Analytics**
   - Which platforms lead to interviews?
   - Response rate by platform
   - Time-to-response metrics

2. **Automated Duplicate Resolution**
   - Auto-merge very high similarity (>95%)
   - Suggested master job based on completeness

3. **Platform-Specific Features**
   - LinkedIn: Import connection referrals
   - Indeed: Track application views
   - Glassdoor: Link to company reviews

4. **Email Integration**
   - Auto-detect platforms from confirmation emails
   - Extract application URLs
   - Track response emails

5. **Bulk Import**
   - CSV import of applications
   - Platform API integrations
   - Browser extension for one-click tracking

6. **Advanced Analytics**
   - Platform ROI dashboard
   - A/B testing by platform
   - Success patterns analysis

## Troubleshooting

### Common Issues

**Issue: Duplicate detection not finding similar jobs**

*Solution:* Check similarity threshold. You may need to adjust:
```typescript
// In duplicate-detection.service.ts
const potentialDuplicates = similarityScores
  .filter((score) => score.similarity >= 0.65) // Lower from 0.7
  .sort((a, b) => b.similarity - a.similarity);
```

**Issue: Too many false positive duplicates**

*Solution:* Increase threshold or adjust weights:
```typescript
const similarity =
  companyMatch * 0.5 +  // Increase company weight
  titleMatch * 0.35 +
  locationMatch * 0.1 +  // Decrease location weight
  dateMatch * 0.05;      // Decrease date weight
```

**Issue: Platform not displaying on job card**

*Solution:*
1. Check if platform was successfully added (check database)
2. Verify platform count updated on jobs table
3. Check browser console for errors
4. Ensure frontend is fetching platforms endpoint

## Contributing

### Code Style

- Follow NestJS conventions
- Use TypeScript strict mode
- Document complex algorithms
- Write tests for new features

### Pull Request Process

1. Create feature branch
2. Implement changes
3. Add tests
4. Update documentation
5. Submit PR with description

## License

This feature is part of the PROPEL job tracking application.

## Support

For issues or questions:
1. Check troubleshooting section
2. Review implementation guide
3. Check backend logs
4. Open GitHub issue

---

**Version**: 1.0.0
**Last Updated**: January 2024
**Author**: Development Team
