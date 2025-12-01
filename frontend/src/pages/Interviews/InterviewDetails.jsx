import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { Icon } from "../../components/ui/Icon";

export default function InterviewDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchInterview() {
    try {
      const userId = localStorage.getItem("userId");
      const { data } = await api.get(`/interview/${id}`, {
        params: { userId },
      });
      setInterview(data);
    } catch (err) {
      console.error("Failed to fetch interview:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this interview?")) return;
    try {
      await api.delete(`/interview/${id}`);
      navigate("/interviews");
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  useEffect(() => {
    fetchInterview();
  }, []);

  if (loading) return <p>Loading interview…</p>;
  if (!interview) return <p>Interview not found.</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">
          {interview.company_name} Interview
        </h1>
        <button
          onClick={handleDelete}
          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Delete
        </button>
      </div>

      <div className="bg-white border rounded-lg p-6 shadow space-y-4">
        <p>
          <strong>Date:</strong>{" "}
          {new Date(interview.interview_date).toLocaleString()}
        </p>
        <p>
          <strong>Type:</strong> {interview.interview_type}
        </p>
        <p>
          <strong>Format:</strong> {interview.interview_format}
        </p>
        <p>
          <strong>Interviewer:</strong> {interview.interviewer_name || "N/A"}
        </p>
        <p>
          <strong>Email:</strong> {interview.interviewer_email || "N/A"}
        </p>
        <p>
          <strong>Location:</strong> {interview.location || "N/A"}
        </p>
        <p>
          <strong>Notes:</strong> {interview.details || "None"}
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          to="/interviews"
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Back
        </Link>

        <Link
          to={`/research?company=${encodeURIComponent(interview.company_name)}`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Icon name="search" variant="white" size="sm" />
          Company Research
        </Link>
      </div>
    </div>
  );
}
