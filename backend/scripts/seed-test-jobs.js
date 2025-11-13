// Script to seed test jobs for filter testing
// Run with: node scripts/seed-test-jobs.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// You'll need to replace this with your actual userId
const TEST_USER_ID = 'YOUR_USER_ID_HERE'; // ← Replace with your user ID

const testJobs = [
  {
    title: 'Senior Software Engineer',
    company: 'Google',
    location: 'Mountain View, CA',
    industry: 'Technology',
    jobType: 'Full-time',
    status: 'Applied',
    salaryMin: 150000,
    salaryMax: 200000,
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
    description: 'Work on cutting-edge technology at Google',
  },
  {
    title: 'Frontend Developer',
    company: 'Meta',
    location: 'Menlo Park, CA',
    industry: 'Technology',
    jobType: 'Full-time',
    status: 'Interviewing',
    salaryMin: 120000,
    salaryMax: 160000,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    description: 'Build amazing user experiences for billions of users',
  },
  {
    title: 'Data Scientist',
    company: 'Amazon',
    location: 'Seattle, WA',
    industry: 'E-commerce',
    jobType: 'Full-time',
    status: 'Interested',
    salaryMin: 130000,
    salaryMax: 180000,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    description: 'Analyze data to improve customer experience',
  },
  {
    title: 'Backend Engineer',
    company: 'Netflix',
    location: 'Los Gatos, CA',
    industry: 'Entertainment',
    jobType: 'Full-time',
    status: 'Applied',
    salaryMin: 140000,
    salaryMax: 190000,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    description: 'Scale systems for millions of concurrent users',
  },
  {
    title: 'DevOps Engineer',
    company: 'Microsoft',
    location: 'Redmond, WA',
    industry: 'Technology',
    jobType: 'Full-time',
    status: 'Offer',
    salaryMin: 135000,
    salaryMax: 175000,
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    description: 'Manage cloud infrastructure at scale',
  },
  {
    title: 'Product Manager',
    company: 'Apple',
    location: 'Cupertino, CA',
    industry: 'Technology',
    jobType: 'Full-time',
    status: 'Rejected',
    salaryMin: 150000,
    salaryMax: 200000,
    deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago (overdue)
    description: 'Lead product development for consumer electronics',
  },
  {
    title: 'UX Designer',
    company: 'Adobe',
    location: 'San Jose, CA',
    industry: 'Software',
    jobType: 'Full-time',
    status: 'Interested',
    salaryMin: 100000,
    salaryMax: 140000,
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days from now
    description: 'Design intuitive experiences for creative professionals',
  },
  {
    title: 'Machine Learning Engineer',
    company: 'Tesla',
    location: 'Palo Alto, CA',
    industry: 'Automotive',
    jobType: 'Full-time',
    status: 'Applied',
    salaryMin: 160000,
    salaryMax: 210000,
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    description: 'Build autonomous driving systems',
  },
  {
    title: 'Security Engineer',
    company: 'Cisco',
    location: 'San Francisco, CA',
    industry: 'Networking',
    jobType: 'Full-time',
    status: 'Interviewing',
    salaryMin: 145000,
    salaryMax: 185000,
    deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days from now
    description: 'Protect enterprise networks from threats',
  },
  {
    title: 'Mobile Developer',
    company: 'Uber',
    location: 'San Francisco, CA',
    industry: 'Transportation',
    jobType: 'Contract',
    status: 'Interested',
    salaryMin: 110000,
    salaryMax: 150000,
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days from now
    description: 'Build mobile apps for millions of riders',
  },
  {
    title: 'Cloud Architect',
    company: 'Salesforce',
    location: 'Remote',
    industry: 'SaaS',
    jobType: 'Full-time',
    status: 'Applied',
    salaryMin: 155000,
    salaryMax: 195000,
    deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days from now
    description: 'Design cloud solutions for enterprise customers',
  },
  {
    title: 'QA Engineer',
    company: 'Spotify',
    location: 'New York, NY',
    industry: 'Music',
    jobType: 'Full-time',
    status: 'Interested',
    salaryMin: 90000,
    salaryMax: 130000,
    deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(), // 18 days from now
    description: 'Ensure quality for music streaming platform',
  },
];

async function seedJobs() {
  console.log('🌱 Starting to seed test jobs...\n');

  if (TEST_USER_ID === 'YOUR_USER_ID_HERE') {
    console.error('❌ Error: Please update TEST_USER_ID in the script with your actual user ID');
    console.log('\nTo find your user ID:');
    console.log('1. Login to your app');
    console.log('2. Open browser console');
    console.log('3. Run: localStorage.getItem("token")');
    console.log('4. Copy the userId from the JWT token payload');
    process.exit(1);
  }

  for (const job of testJobs) {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          userId: TEST_USER_ID,
          ...job,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          statusUpdatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed to create "${job.title}":`, error.message);
      } else {
        console.log(`✅ Created: ${job.title} at ${job.company}`);
      }
    } catch (err) {
      console.error(`❌ Error creating "${job.title}":`, err.message);
    }
  }

  console.log('\n✨ Done seeding test jobs!');
  console.log('\nNow you can test filters:');
  console.log('- Status: Applied, Interviewing, Interested, Offer, Rejected');
  console.log('- Industry: Technology, E-commerce, Entertainment, etc.');
  console.log('- Location: CA, WA, NY, Remote');
  console.log('- Salary: Various ranges from $90k-$210k');
  console.log('- Deadline: Mix of overdue, urgent, and future dates');
}

seedJobs().catch(console.error);
