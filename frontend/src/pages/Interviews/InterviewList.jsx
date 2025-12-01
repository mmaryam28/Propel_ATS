import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../components/ui/Icon";
import { api } from "../../lib/api";

export default function InterviewList() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchInterviews() {
    try {
      const userId = localStorage.getItem("userId");
      const { data } = await api.get("/interview", {
        params: { userId }
      });
      setInterviews(data || []);
    } catch (err) {
      console.error("Failed to load interviews:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInterviews();
  }, []);

  if (loading) return <p>Loading interviews…</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Your Interviews</h1>
        <Link
          to="/interviews/schedule"
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
        >
          <Icon name="add" size="sm" variant="white" />
          Schedule Interview
        </Link>
      </div>

      {interviews.length === 0 ? (
        <p className="text-gray-600">No interviews scheduled.</p>
      ) : (
        <div className="space-y-4">
          {interviews.map((int) => (
            <Link
              key={int.id}
              to={`/interviews/${int.id}`}
              className="block p-4 bg-white border rounded-lg shadow hover:bg-gray-50 transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">{int.company_name}</h2>
                  <p className="text-gray-600">
                    {new Date(int.interview_date).toLocaleString()}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {int.interview_type} • {int.interview_format}
                  </p>
                </div>
                <Icon name="arrow-right" size="md" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
