import React from 'react';

export default function Profile() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Profile</h1>

      {/* White container (card) */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-3xl mx-auto">
        <form className="space-y-6">
          {/* Basic info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="form-label" htmlFor="firstName">First name</label>
              <input
                id="firstName"
                className="input w-full border-gray-300 rounded-md px-3 py-2"
                placeholder="Joe"
              />
            </div>
            <div>
              <label className="form-label" htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                className="input w-full border-gray-300 rounded-md px-3 py-2"
                placeholder="Doe"
              />
            </div>
            <div>
              <label className="form-label" htmlFor="role">Role</label>
              <input
                id="role"
                className="input w-full border-gray-300 rounded-md px-3 py-2"
                placeholder="Frontend Engineer"
              />
            </div>
          </div>

          {/* Contact row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input w-full border-gray-300 rounded-md px-3 py-2"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="form-label" htmlFor="phone">Phone</label>
              <input
                id="phone"
                className="input w-full border-gray-300 rounded-md px-3 py-2"
                placeholder="(555) 555-5555"
              />
            </div>
          </div>

          {/* Bio area */}
          <div>
            <label className="form-label" htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              rows={4}
              className="input w-full border-gray-300 rounded-md px-3 py-2"
              placeholder="A short bio…"
            />
            <p className="form-help text-sm text-gray-500 mt-1">
              This appears on your profile.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-#1e88e5 text-white font-medium hover:bg-blue-700 transition"
            >
              Save changes
            </button>

            <button
              type="button"
              className="px-4 py-2 rounded-md border border-gray-500 text-gray-700 bg-gray-200 font-medium 
                         hover:bg-gray-100 hover:border-gray-300 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
