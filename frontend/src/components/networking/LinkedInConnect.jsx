import { linkedinAuthAPI } from '../../api/networking';

export default function LinkedInConnect({ status, onRefresh }) {
  const handleConnect = async () => {
    try {
      await linkedinAuthAPI.initiateConnect();
    } catch (error) {
      console.error('LinkedIn connection error:', error);
      alert('Failed to connect to LinkedIn. Please make sure you are logged in.');
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm('Are you sure you want to disconnect your LinkedIn account?')) {
      try {
        await linkedinAuthAPI.disconnect();
        onRefresh();
      } catch (error) {
        console.error('Error disconnecting LinkedIn:', error);
        alert('Failed to disconnect LinkedIn account');
      }
    }
  };

  const handleImportProfile = async () => {
    try {
      const response = await linkedinAuthAPI.importProfile();
      if (response.data.contact) {
        alert('Profile imported successfully!');
        window.location.reload();
      } else {
        alert(response.data.error || 'Failed to import profile');
      }
    } catch (error) {
      console.error('Error importing profile:', error);
      alert('Failed to import profile');
    }
  };

  if (!status.connected) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="h-10 w-10 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Connect LinkedIn</h3>
              <p className="text-sm text-gray-600">
                Import your LinkedIn profile and connections to enhance your network
              </p>
            </div>
          </div>
          <button
            onClick={handleConnect}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Connect LinkedIn
          </button>
        </div>
      </div>
    );
  }

  const profile = status.account?.profile || {};
  const profilePicture = profile.picture;
  const profileName = profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim();
  const profileEmail = profile.email;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {profilePicture ? (
            <img
              src={profilePicture}
              alt={profileName}
              className="h-16 w-16 rounded-full border-2 border-green-500"
            />
          ) : (
            <svg className="h-16 w-16 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          )}
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">
              LinkedIn Connected ✓
            </h3>
            <p className="text-base font-semibold text-gray-900">
              {profileName || 'Account connected'}
            </p>
            {profileEmail && (
              <p className="text-sm text-gray-600">{profileEmail}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleImportProfile}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            Import Profile
          </button>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}
