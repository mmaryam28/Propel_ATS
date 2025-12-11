import { Link, useLocation } from 'react-router-dom';
import { Menu } from '@headlessui/react';

export default function Navbar() {
  const location = useLocation();
  const profileActive = location.pathname.startsWith('/profile') || 
                        location.pathname.startsWith('/education') || 
                        location.pathname.startsWith('/certifications') || 
                        location.pathname.startsWith('/projects') || 
                        location.pathname.startsWith('/skills') ||
                        location.pathname.startsWith('/employment');
  const jobsActive = location.pathname.startsWith('/jobs') || 
                     location.pathname.startsWith('/resumes') || 
                     location.pathname.startsWith('/coverletters');
  const prepareActive = location.pathname.startsWith('/prepare');
  
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="text-primary-600 text-xl font-bold">
                🚀 PROPEL
              </Link>
            </div>

            {/* Main Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">

                <NavLink to="/dashboard">Dashboard</NavLink>

              {/* Profile dropdown */}
              <NavDropdown 
                label="Profile" 
                active={profileActive}
                items={[
                  { to: '/profile/summary', label: 'Profile Overview' },
                  { to: '/education', label: 'Education' },
                  { to: '/certifications', label: 'Certifications' },
                  { to: '/projects', label: 'Projects' },
                  { to: '/skills', label: 'Skills' },
                  { to: '/employment', label: 'Employment' },
                ]}
              />

              {/* Jobs dropdown */}
              <NavDropdown 
                label="Jobs" 
                active={jobsActive}
                items={[
                  { to: '/jobs', label: 'Job Tracker' },
                  { to: '/jobs/calendar', label: 'Calendar' },
                  { to: '/resumes', label: 'Resumes' },
                  { to: '/coverletters', label: 'Cover Letters' },
                  { to: '/quality-check', label: 'Quality Check' },
                  { to: '/application-quality', label: 'Application Quality Scoring' },
                ]}
              />

              {/* Prepare dropdown */}
              <NavDropdown 
                label="Prepare" 
                active={prepareActive}
                items={[
                  { to: '/prepare/interview', label: 'Interview Prep' },
                  { to: '/prepare/salary', label: 'Salary Research' },
                  { to: '/prepare/company', label: 'Company Research' },
                ]}
              />

              {/* Networking dropdown */}
              <NavDropdown 
                label="Networking" 
                active={location.pathname.startsWith('/networking')}
                items={[
                  { to: '/networking/contacts', label: 'Contacts' },
                  { to: '/networking/referrals', label: 'Referral Requests' },
                  { to: '/networking/references', label: 'Professional References' },
                  { to: '/networking/events', label: 'Events' },
                  { to: '/networking/interviews', label: 'Informational Interviews' },
                  { to: '/networking/maintenance', label: 'Relationship Maintenance' },
                ]}
              />
            </div>
          </div>

          {/* User Profile Dropdown */}
          <div className="flex items-center">
            <Menu as="div" className="ml-3 relative">
              <Menu.Button className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">
                    P
                  </span>
                </div>
              </Menu.Button>

              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/profile/edit"
                      className={active ? 'bg-gray-100 block px-4 py-2 text-sm text-gray-700' : 'block px-4 py-2 text-sm text-gray-700'}
                    >
                      Settings
                    </Link>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('userId');
                        window.location.href = '/login';
                      }}
                      className={active ? 'bg-gray-100 block w-full text-left px-4 py-2 text-sm text-gray-700' : 'block w-full text-left px-4 py-2 text-sm text-gray-700'}
                    >
                      Logout
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Menu>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Helper component for navigation links
function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={isActive 
        ? 'inline-flex items-center px-1 pt-1 border-b-2 border-primary-500 text-gray-900 text-sm font-medium'
        : 'inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 text-sm font-medium'
      }
    >
      {children}
    </Link>
  );
}

// Helper component for dropdown navigation
function NavDropdown({ label, active, items }) {
  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className={
          (active
            ? 'border-primary-500 text-gray-900 '
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 ') +
          'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
        }
      >
        {label}
        <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.188l3.71-3.957a.75.75 0 111.08 1.04l-4.24 4.52a.75.75 0 01-1.08 0l-4.24-4.52a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </Menu.Button>

      <Menu.Items className="absolute z-20 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
        <div className="py-1">
          {items.map((item) => (
            <Menu.Item key={item.to}>
              {({ active }) => (
                <Link
                  to={item.to}
                  className={
                    (active ? 'bg-gray-100 ' : '') + 
                    'block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
                  }
                >
                  {item.label}
                </Link>
              )}
            </Menu.Item>
          ))}
        </div>
      </Menu.Items>
    </Menu>
  );
}