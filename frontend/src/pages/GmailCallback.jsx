import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { connectGmail } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';

export default function GmailCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    const success = searchParams.get('success');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus('error');
      const errorMessages = {
        'no_code': 'No authorization code received',
        'connection_failed': 'Failed to connect Gmail account',
      };
      setError(errorMessages[errorParam] || 'Authorization cancelled or failed');
      setTimeout(() => {
        navigate('/jobs');
      }, 3000);
      return;
    }

    if (success === 'true') {
      setStatus('success');
      
      // Return to the job page if we stored it
      const returnJob = localStorage.getItem('gmail_return_job');
      localStorage.removeItem('gmail_return_job');
      
      setTimeout(() => {
        if (returnJob) {
          navigate(`/jobs/${returnJob}`);
        } else {
          navigate('/jobs');
        }
      }, 2000);
    } else {
      setStatus('error');
      setError('Invalid callback response');
      setTimeout(() => {
        navigate('/jobs');
      }, 3000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full p-8">
        {status === 'processing' && (
          <div className="text-center">
            <Icon name="loader" className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
            <h2 className="text-xl font-semibold mb-2">Connecting Gmail...</h2>
            <p className="text-gray-600">Please wait while we set up your email integration.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Icon name="check" className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Successfully Connected!</h2>
            <p className="text-gray-600">Your Gmail account has been connected. Redirecting...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Icon name="x" className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Connection Failed</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-gray-600 text-sm">Redirecting to jobs...</p>
          </div>
        )}
      </Card>
    </div>
  );
}
