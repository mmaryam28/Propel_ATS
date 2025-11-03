// src/pages/EmploymentHistory.jsx
import React, { useState } from "react";
import "../components/ProfileForm.css"; // keep using your CSS

export default function EmploymentHistoryPage() {
  const [employment, setEmployment] = useState({
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  });

  const [employmentHistory, setEmploymentHistory] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [employmentError, setEmploymentError] = useState("");
  const [employmentSuccess, setEmploymentSuccess] = useState("");
  const [descCount, setDescCount] = useState(0);

  const handleEmploymentSubmit = () => {
    const { title, company, startDate, endDate, current } = employment;

    if (!title || !company || !startDate) {
      setEmploymentError("Please fill in all required fields (Title, Company, Start Date).");
      setEmploymentSuccess("");
      return;
    }
    if (!current && endDate && new Date(startDate) > new Date(endDate)) {
      setEmploymentError("Start date cannot be after end date.");
      setEmploymentSuccess("");
      return;
    }

    const updated = [...employmentHistory];
    if (editingIndex !== null) {
      updated[editingIndex] = employment;
      setEditingIndex(null);
    } else {
      updated.unshift(employment); // newest first
    }

    setEmploymentHistory(updated);
    setEmployment({
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    });
    setDescCount(0);
    setEmploymentError("");
    setEmploymentSuccess("Employment entry saved successfully!");
  };

  const handleEmploymentCancel = () => {
    setEmployment({
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    });
    setDescCount(0);
    setEmploymentError("");
    setEmploymentSuccess("");
    setEditingIndex(null);
  };

  const handleEditEmployment = (index) => {
    setEmployment(employmentHistory[index]);
    setEditingIndex(index);
    setEmploymentError("");
    setEmploymentSuccess("");
  };

  const handleDeleteEmployment = (index) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      setEmploymentHistory(employmentHistory.filter((_, i) => i !== index));
    }
  };

  const handleFinish = () => {
    localStorage.setItem("employmentHistory", JSON.stringify(employmentHistory));
    window.location.href = "/summary";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col items-start">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">
        Employment History
      </h1>
      <p className="mt-1 text-sm text-gray-600">Keep track of your Employment History.</p>
    </div>
      </div>

      {/* Card */}
      <div className="profile-container">
        <form
          className="employment-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleEmploymentSubmit();
          }}
        >
          <label>Job Title *</label>
          <input
            type="text"
            value={employment.title}
            onChange={(e) => setEmployment({ ...employment, title: e.target.value })}
            required
          />

          <label>Company Name *</label>
          <input
            type="text"
            value={employment.company}
            onChange={(e) => setEmployment({ ...employment, company: e.target.value })}
            required
          />

          <label>Location</label>
          <input
            type="text"
            value={employment.location}
            onChange={(e) => setEmployment({ ...employment, location: e.target.value })}
          />

          <div className="date-row">
            <div>
              <label>Start Date *</label>
              <input
                type="date"
                value={employment.startDate}
                onChange={(e) => setEmployment({ ...employment, startDate: e.target.value })}
                required
              />
            </div>

            {!employment.current && (
              <div>
                <label>End Date</label>
                <input
                  type="date"
                  value={employment.endDate}
                  onChange={(e) => setEmployment({ ...employment, endDate: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="current-position">
            <input
              type="checkbox"
              id="currentPosition"
              checked={employment.current}
              onChange={(e) =>
                setEmployment({ ...employment, current: e.target.checked, endDate: "" })
              }
            />
            <label htmlFor="currentPosition">Current Position</label>
          </div>

          <label>Job Description</label>
          <textarea
            maxLength={1000}
            value={employment.description}
            onChange={(e) => {
              setEmployment({ ...employment, description: e.target.value });
              setDescCount(e.target.value.length);
            }}
            placeholder="Describe your role and responsibilities..."
          />
          <p>{descCount}/1000 characters</p>

          {employmentError && <p className="error">{employmentError}</p>}
          {employmentSuccess && <p className="success">{employmentSuccess}</p>}

          <div className="button-group">
            <button type="submit" className="btn btn-primary btn-md">{editingIndex !== null ? "Update Entry" : "Save Entry"}</button>
            <button type="button" className="cancel-btn px-4 py-2 rounded-md border" onClick={handleEmploymentCancel}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary btn-md" onClick={handleFinish}>
              Finish
            </button>
          </div>
        </form>

        <h3 className="section-title mt-8">Previous Roles</h3>
        <div className="employment-list">
          {employmentHistory.length === 0 ? (
            <p>No employment history added yet.</p>
          ) : (
            employmentHistory.map((job, index) => (
              <div
                key={index}
                className={`employment-entry ${job.current ? "current-role" : "past-role"}`}
              >
                <div className="employment-header">
                  <h4>{job.title}</h4>
                  <p className="company">{job.company}</p>
                  <p className="dates">
                    {job.startDate} – {job.current ? "Present" : job.endDate || "N/A"}
                  </p>
                  <p className="location">{job.location}</p>
                </div>

                <p className="description">{job.description}</p>

                <div className="button-group">
                  <button
                    type="button"
                    className="edit-btn"
                    onClick={() => handleEditEmployment(index)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => handleDeleteEmployment(index)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
