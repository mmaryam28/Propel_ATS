// src/pages/Skills.tsx
import ProfileSkills from "../components/profile/ProfileSkills";

export default function Skills() {
  // TODO: replace with real userId from auth
  const userId = "demo-user-1";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page header (tight spacing) */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Skills</h1>
        <p className="mt-1 text-sm text-gray-600">Showcase your skills.</p>
      </div>

      {/* White card wrapper */}
      <div className="mt-6 page-card">
        <div className="page-card-inner">
          <ProfileSkills userId={userId} />
        </div>
      </div>
    </div>
  );
}