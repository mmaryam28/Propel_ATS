import { Link, useLocation } from 'react-router-dom';
import { Menu } from '@headlessui/react';

export default function Navbar() {
  const location = useLocation();
  const coverActive = location.pathname.startsWith('/coverletters');
  
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="text-primary-600 text-xl font-bold">
                Propel
              </Link>
            </div>

            {/* Main Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/jobs">Jobs</NavLink>
              <NavLink to="/jobs/calendar">Calendar</NavLink>
              <NavLink to="/education">Education</NavLink>
              <NavLink to="/certifications">Certifications</NavLink>
              <NavLink to="/projects">Projects</NavLink>
              <NavLink to="/applications">Applications</NavLink>

              {/* Cover Letters dropdown */}
              <Menu as="div" className="relative">
                <Menu.Button
                  className={
                    (coverActive
                      ? 'border-primary-500 text-gray-900 '
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 ') +
                    'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                  }
                >
                  Cover Letters
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="ml-1 h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.188l3.71-3.957a.75.75 0 111.08 1.04l-4.24 4.52a.75.75 0 01-1.08 0l-4.24-4.52a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Menu.Button>

                <Menu.Items className="absolute z-20 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/coverletters"
                          className={(active ? 'bg-gray-100 ' : '') + 'block px-4 py-2 text-sm text-gray-700'}
                        >
                          Overview
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/coverletters/templates"
                          className={(active ? 'bg-gray-100 ' : '') + 'block px-4 py-2 text-sm text-gray-700'}
                        >
                          Templates
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/coverletters/generate"
                          className={(active ? 'bg-gray-100 ' : '') + 'block px-4 py-2 text-sm text-gray-700'}
                        >
                          Generate with AI
                        </Link>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Menu>
            </div>
          </div>

          {/* Profile Dropdown */}
          <div className="flex items-center">
            <Menu as="div" className="ml-3 relative">
              <Menu.Button className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    P
                  </span>
                </div>
              </Menu.Button>

              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/profile/edit"
                      className={active ? 'bg-gray-100 block px-4 py-2 text-sm text-gray-700' : 'block px-4 py-2 text-sm text-gray-700'}
                    >
                      Edit Profile
                    </Link>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/profile/summary"
                      className={active ? 'bg-gray-100 block px-4 py-2 text-sm text-gray-700' : 'block px-4 py-2 text-sm text-gray-700'}
                    >
                      View Profile
                    </Link>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => {
                        // Add logout logic here
                        window.location.href = '/login';
                      }}
                      className={active ? 'bg-gray-100 block w-full text-left px-4 py-2 text-sm text-gray-700' : 'block w-full text-left px-4 py-2 text-sm text-gray-700'}
                    >
                      Sign out
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