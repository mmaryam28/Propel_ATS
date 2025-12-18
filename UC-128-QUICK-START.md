# UC-128: Career Path Simulation - Quick Start

## 🚀 Getting Started (3 Steps)

### 1. Run Database Migration
```sql
-- Copy and execute this file in Supabase SQL Editor:
backend/sql/uc128_career_simulation.sql
```

Creates 4 tables + seed data for Technology, Finance, Healthcare industries.

### 2. Install Chart Library (Frontend)
```bash
cd frontend
npm install recharts
```

### 3. Access Feature
Navigate to: **http://localhost:5173/simulation**

Or use the navigation menu: **Jobs → 📈 Career Simulation**

---

## 📊 What You Can Do

### Create Simulations
- From scratch with custom parameters
- From existing job applications
- From accepted job offers

### View Predictions
- **3 Scenarios**: Best case, Average case, Worst case
- **Lifetime Earnings**: Total compensation over 5-20 years
- **Career Progression**: Year-by-year role advancement
- **Skills Tracking**: What skills you'll acquire

### Get Insights
- **Decision Points**: Key moments to stay vs switch (Years 3, 5, 8)
- **Recommendations**: Personalized career advice based on your priorities
- **Probability Scores**: Likelihood of reaching each scenario

---

## 🎯 Example: Running Your First Simulation

1. Click "**New Simulation**"

2. Fill in basic info:
   ```
   Name: Software Engineering Career 2025
   Starting Role: Software Engineer
   Starting Salary: $120,000
   Industry: Technology
   Company Size: Medium
   Years: 10
   ```

3. Set your priorities (must sum to 1.0):
   ```
   Work-Life Balance: 0.30
   Salary Growth: 0.40
   Learning: 0.30
   ```

4. Choose risk tolerance: **Moderate**

5. Click "**Run Simulation**"

6. View results:
   - **Best Case Lifetime**: ~$2.1M
   - **Average Case Lifetime**: ~$1.6M
   - **Worst Case Lifetime**: ~$1.3M

---

## 📈 Understanding the Charts

### Salary Projection Chart
- Shows all three scenarios over time
- Y-axis: Annual salary
- X-axis: Years into career
- Green line = Best case
- Blue line = Average case
- Orange line = Worst case

### Career Timeline
- Vertical timeline showing role progression
- Each milestone shows:
  - Year number
  - Role title
  - Salary
  - Company type
  - Skills acquired
  - Probability of reaching this point

---

## 💡 Decision Points Explained

### Year 3: Stay or Switch?
**Options:**
- **Stay and Specialize**: +5% salary, deeper expertise
- **Switch Companies**: +20% salary, broader experience

### Year 5: IC vs Management?
**Options:**
- **Technical Track**: +10% salary, remain hands-on
- **Management Track**: +15% salary, people leadership

### Year 8: Executive Path?
**Options:**
- **Executive Leadership**: +40% salary, high stress
- **Stay Senior Level**: +8% salary, work-life balance

---

## 🎨 Customizing Simulations

### Adjust After Creation
1. Open any simulation
2. Click "**Adjust Preferences**"
3. Change priority weights or risk tolerance
4. Simulation automatically re-runs

### Compare Multiple Paths
Create multiple simulations to compare:
- Different starting roles
- Different industries
- Different company sizes
- Different priority settings

---

## 🔗 Integration with Other Features

### From Job Tracker
Every job card has a "**Simulate Career**" button that pre-fills:
- Job title → Starting role
- Salary → Starting salary
- Industry → Industry

### From Offers Page
When you receive an offer, create a simulation to see:
- Long-term impact of accepting
- Expected progression at that company
- Lifetime earnings projection

---

## 🛠️ API Endpoints

```javascript
// Frontend API calls
import { simulationApi } from '../api/simulation';

// Create simulation
await simulationApi.createSimulation({
  simulationName: 'My Career Path',
  startingRole: 'Engineer',
  startingSalary: 100000,
  // ... other fields
});

// List all simulations
const { data } = await simulationApi.listSimulations();

// Get one simulation
const { data } = await simulationApi.getSimulation(id);

// Update simulation
await simulationApi.updateSimulation(id, { riskTolerance: 'high' });

// Delete simulation
await simulationApi.deleteSimulation(id);
```

---

## 📁 Files Created

### Backend
```
backend/src/simulation/
├── dto/
│   └── simulation.dto.ts          (DTOs & interfaces)
├── simulation.controller.ts       (REST API endpoints)
├── simulation.service.ts          (Business logic)
└── simulation.module.ts           (NestJS module)

backend/sql/
└── uc128_career_simulation.sql   (Database schema)
```

### Frontend
```
frontend/src/
├── api/
│   └── simulation.js              (API client)
├── pages/
│   ├── CareerSimulation.jsx       (List view)
│   └── SimulationDetail.jsx       (Detail view with charts)
└── components/
    └── SimulateFromJobButton.jsx  (Integration button)
```

---

## 🐛 Troubleshooting

### "No users found in auth.users table"
**Solution**: Make sure you're logged in. The simulation uses your user ID.

### Charts not showing
**Solution**: Install recharts:
```bash
npm install recharts
```

### "Simulation not found"
**Solution**: Check that the simulation ID is valid and belongs to your user.

### Weights don't sum to 1.0
**Solution**: Adjust sliders so Work-Life Balance + Salary + Learning = 1.0

### No decision points showing
**Solution**: This is normal for simulations < 5 years or certain scenarios.

---

## 📊 Understanding the Numbers

### Lifetime Earnings
Sum of all annual salaries across simulation period.

**Example**: 10-year simulation
- Year 0: $120k
- Year 1: $126k (+5%)
- Year 2: $132k (+5%)
- ...
- Year 10: $195k
- **Total**: ~$1.6M

### Probability Scores
Likelihood of reaching each point in the simulation.

- **Best case starts at 15%** and decreases over time
- **Average case starts at 70%** and remains stable
- **Worst case starts at 15%** and decreases over time

The further out the prediction, the more uncertainty.

### Satisfaction Scores
Predicted job satisfaction (0-10 scale) based on:
- Work-life balance preferences
- Salary growth achievement
- Learning opportunities
- Career progression pace

---

## 🎓 Best Practices

### 1. Run Multiple Scenarios
Don't rely on one simulation. Compare:
- Conservative path (low risk)
- Ambitious path (high risk)
- Balanced path (moderate risk)

### 2. Update Regularly
Re-run simulations:
- After receiving offers
- When considering job changes
- Annually to adjust for market changes

### 3. Validate Assumptions
- Check if salary ranges match market data
- Verify industry growth rates are realistic
- Adjust based on your actual experience

### 4. Use Decision Points
Pay attention to key decision years:
- Have a plan for each decision point
- Consider both scenarios before deciding
- Document your reasoning

### 5. Balance Priorities
Don't optimize for salary alone:
- Work-life balance matters for longevity
- Learning opportunities compound over time
- Impact and meaning affect satisfaction

---

## 🚀 Advanced Features

### Custom Industry Data
Add your own industry trends:
```sql
INSERT INTO industry_trends (industry, year, growth_rate, avg_salary_increase, job_market_score, economic_outlook)
VALUES ('YourIndustry', 2025, 5.5, 4.0, 7.5, 'good');
```

### Custom Career Templates
Define your own progression paths:
```sql
INSERT INTO career_role_templates (
  role_name, industry, level, 
  typical_years_to_next, avg_salary_min, avg_salary_max
) VALUES (
  'Your Role', 'Your Industry', 4, 
  3, 150000, 200000
);
```

---

## 📞 Support

Having issues? Check:
1. Browser console for JavaScript errors
2. Network tab for API call failures
3. Supabase logs for database errors
4. Make sure backend server is running
5. Verify you're authenticated

---

## ✅ Acceptance Criteria Met

All UC-128 requirements implemented:
- ✅ Career trajectory modeling
- ✅ Industry trends integration  
- ✅ 5-year and 10-year projections
- ✅ Lifetime earnings calculations
- ✅ Decision point identification
- ✅ Role recommendations
- ✅ Probability distributions
- ✅ Custom success criteria

---

**Ready to simulate your career path? Start at `/simulation`!** 🎉
