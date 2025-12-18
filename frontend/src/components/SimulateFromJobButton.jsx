import React from 'react';
import { TrendingUp } from 'lucide-react';
import { simulationApi } from '../api/simulation';
import { useNavigate } from 'react-router-dom';

/**
 * Button to create a career simulation from a job or offer
 * Can be used in job cards or offer detail pages
 */
export default function SimulateFromJobButton({ job, offer, className = '' }) {
  const navigate = useNavigate();
  const [creating, setCreating] = React.useState(false);

  async function handleSimulate() {
    setCreating(true);
    
    try {
      let simulationData = {};
      
      if (job) {
        simulationData = {
          simulationName: `${job.title} at ${job.company}`,
          startingRole: job.title,
          startingSalary: job.salaryMax || job.salaryMin || 100000,
          industry: job.industry || 'Technology',
          companySize: 'medium',
          simulationYears: 10,
          jobId: job.id,
        };
      } else if (offer) {
        simulationData = {
          simulationName: `${offer.jobTitle} at ${offer.company}`,
          startingRole: offer.jobTitle,
          startingSalary: offer.totalComp || offer.baseSalary,
          industry: 'Technology',
          companySize: 'medium',
          simulationYears: 10,
          offerId: offer.id,
        };
      }

      const { data } = await simulationApi.createSimulation(simulationData);
      navigate(`/simulation/${data.id}`);
    } catch (err) {
      console.error('Failed to create simulation:', err);
      alert('Failed to create simulation');
    } finally {
      setCreating(false);
    }
  }

  return (
    <button
      onClick={handleSimulate}
      disabled={creating}
      className={`flex items-center gap-2 ${className}`}
      title="Simulate career path for this role"
    >
      <TrendingUp className="w-4 h-4" />
      {creating ? 'Creating...' : 'Simulate Career'}
    </button>
  );
}
