// src/pages/EmploymentHistory.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import "../components/ProfileForm.css";

export default function EmploymentHistoryPage() {
  const API = 'http://localhost:3000';
  console.log('🔥 API URL:', API);
  const [employment, setEmployment] = useState({
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
    employmentType: "",
    responsibilities: [],
    skills: [],
    displayOrder: 0
  });
  const [currentResponsibility, setCurrentResponsibility] = useState("");
  const [currentSkill, setCurrentSkill] = useState("");
  const [employmentHistory, setEmploymentHistory] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [employmentError, setEmploymentError] = useState("");
  const [employmentSuccess, setEmploymentSuccess] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [userId, setUserId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch current user info on mount
  useEffect(() => {
    const token = window.localStorage.getItem('token');
    if (!token) return;
    axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (r.data?.user?.id) {
          setUserId(r.data.user.id);
          // Fetch employment history for this user
          axios.get(`${API}/employment/${r.data.user.id}`)
            .then((res) => setEmploymentHistory(Array.isArray(res.data) ? res.data : []))
            .catch(() => setEmploymentHistory([]));
        }
      });
  }, []);

  const handleEmploymentSubmit = async () => {
    const { title, company, startDate, endDate, current, employmentType } = employment;
    
    if (!userId) {
      setEmploymentError("User not authenticated. Please refresh the page.");
      setEmploymentSuccess("");
      return;
    }
    
    if (!title || !company || !startDate) {
      setEmploymentError("Please fill in all required fields (Title, Company, Start Date).");
      setEmploymentSuccess("");
      return;
    }
    
    if (!employmentType) {
      setEmploymentError("Please select an employment type.");
      setEmploymentSuccess("");
      return;
    }
    
    if (!current && endDate && new Date(startDate) > new Date(endDate)) {
      setEmploymentError("Start date cannot be after end date.");
      setEmploymentSuccess("");
      return;
    }
    if (employment.responsibilities.length === 0) {
      setEmploymentError("Please add at least one responsibility/achievement.");
      setEmploymentSuccess("");
      return;
    }
    
    const payload = {
      title: employment.title,
      company: employment.company,
      location: employment.location,
      startDate: employment.startDate,
      endDate: employment.endDate,
      current: employment.current,
      description: employment.description,
      employmentType: employment.employmentType,
      responsibilities: employment.responsibilities,
      skills: employment.skills,
      displayOrder: employment.displayOrder,
      userId
    };
    
    console.log('Submitting employment data:', payload);
    
    try {
      if (editingIndex !== null && employmentHistory[editingIndex]?.id) {
        // Update existing entry
        await axios.put(`${API}/employment/${employmentHistory[editingIndex].id}`, payload);
      } else {
        // Add new entry
        await axios.post(`${API}/employment`, payload);
      }
      // Refresh history
  const res = await axios.get(`${API}/employment/${userId}`);
  console.log('Fetched employment history:', res.data);
  setEmploymentHistory([...res.data]); // Force new array reference
  setRefreshKey(prev => prev + 1); // Force re-render
      setEditingIndex(null);
      setEmployment({
        title: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        description: "",
        employmentType: "",
        responsibilities: [],
        skills: [],
        displayOrder: 0
      });
      setCurrentResponsibility("");
      setCurrentSkill("");
      setEmploymentError("");
      setEmploymentSuccess("Employment entry saved successfully!");
    } catch (err) {
      console.error('Error saving employment:', err);
      setEmploymentError("Failed to save employment entry.");
      setEmploymentSuccess("");
    }
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
      employmentType: "",
      responsibilities: [],
      skills: [],
      displayOrder: 0
    });
    setCurrentResponsibility("");
    setCurrentSkill("");
    setEmploymentError("");
    setEmploymentSuccess("");
    setEditingIndex(null);
  };

  const handleEditEmployment = (index) => {
    const job = employmentHistory[index];
    
    // Helper to format date from ISO to YYYY-MM format for month input
    const formatToMonthInput = (dateStr) => {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    };
    
    setEmployment({
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      startDate: formatToMonthInput(job.start_date || job.startDate),
      endDate: formatToMonthInput(job.end_date || job.endDate),
      current: job.current || false,
      description: job.description || "",
      employmentType: job.employment_type || job.employmentType || "",
      responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities : [],
      skills: Array.isArray(job.skills) ? job.skills : [],
      displayOrder: job.display_order || job.displayOrder || 0
    });
    setEditingIndex(index);
    setEmploymentError("");
    setEmploymentSuccess("");
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (index) => {
    setDeleteIndex(index);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const entry = employmentHistory[deleteIndex];
      if (entry?.id) {
        await axios.delete(`${API}/employment/${entry.id}`);
      }
      // Refresh history
      const res = await axios.get(`${API}/employment/${userId}`);
      setEmploymentHistory(Array.isArray(res.data) ? res.data : []);
    } catch {
      // fallback: remove locally
      setEmploymentHistory(employmentHistory.filter((_, i) => i !== deleteIndex));
    }
    setShowDeleteModal(false);
    setDeleteIndex(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteIndex(null);
  };

  const addResponsibility = () => {
    if (currentResponsibility.trim()) {
      setEmployment({
        ...employment,
        responsibilities: [...employment.responsibilities, currentResponsibility.trim()]
      });
      setCurrentResponsibility("");
    }
  };

  const removeResponsibility = (index) => {
    setEmployment({
      ...employment,
      responsibilities: employment.responsibilities.filter((_, i) => i !== index)
    });
  };

  const addSkill = () => {
    if (currentSkill.trim()) {
      setEmployment({
        ...employment,
        skills: [...employment.skills, currentSkill.trim()]
      });
      setCurrentSkill("");
    }
  };

  const removeSkill = (index) => {
    setEmployment({
      ...employment,
      skills: employment.skills.filter((_, i) => i !== index)
    });
  };

  const moveEntry = async (index, direction) => {
    const newHistory = [...employmentHistory];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newHistory.length) return;
    
    [newHistory[index], newHistory[targetIndex]] = [newHistory[targetIndex], newHistory[index]];
    
    // Update display_order for both entries
    try {
      await Promise.all([
        axios.put(`${API}/employment/${newHistory[index].id}`, { 
          displayOrder: newHistory.length - index 
        }),
        axios.put(`${API}/employment/${newHistory[targetIndex].id}`, { 
          displayOrder: newHistory.length - targetIndex 
        })
      ]);
      const res = await axios.get(`${API}/employment/${userId}`);
      setEmploymentHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to reorder entries', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
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

          <label>Employment Type *</label>
          <select
            value={employment.employmentType}
            onChange={(e) => setEmployment({ ...employment, employmentType: e.target.value })}
            required
          >
            <option value="">Select Type</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
            <option value="Freelance">Freelance</option>
          </select>

          <label>Location</label>
          <input
            type="text"
            value={employment.location}
            onChange={(e) => setEmployment({ ...employment, location: e.target.value })}
            placeholder="e.g., San Francisco, CA or Remote"
          />

          <div className="date-row">
            <div>
              <label>Start Date (Month/Year) *</label>
              <input
                type="month"
                value={employment.startDate}
                onChange={(e) => setEmployment({ ...employment, startDate: e.target.value })}
                required
              />
            </div>

            {!employment.current && (
              <div>
                <label>End Date (Month/Year)</label>
                <input
                  type="month"
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

          <label>Key Responsibilities & Achievements *</label>
          <p className="text-sm text-gray-600 mb-2">Add 3-5 bullet points highlighting your accomplishments (like a resume)</p>
          <div className="responsibilities-section">
            <div className="input-with-button">
              <input
                type="text"
                value={currentResponsibility}
                onChange={(e) => setCurrentResponsibility(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addResponsibility();
                  }
                }}
                placeholder="e.g., Led a team of 5 developers to deliver project 2 weeks ahead of schedule"
              />
              <button 
                type="button" 
                onClick={addResponsibility}
                className="btn btn-primary btn-sm add-bullet-btn"
              >
                Add Bullet
              </button>
            </div>
            <div className="bullets-list">
              {employment.responsibilities.map((resp, idx) => (
                <div key={idx} className="bullet-item">
                  <span className="bullet-dot">•</span>
                  <span className="bullet-text">{resp}</span>
                  <button
                    type="button"
                    onClick={() => removeResponsibility(idx)}
                    className="remove-bullet-btn"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <label>Skills & Technologies Used</label>
          <p className="text-sm text-gray-600 mb-2">Add relevant skills, tools, or technologies</p>
          <div className="skills-section">
            <div className="input-with-button">
              <input
                type="text"
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="e.g., React, Python, AWS, Agile"
              />
              <button 
                type="button" 
                onClick={addSkill}
                className="btn btn-primary btn-sm add-skill-btn"
              >
                Add Skill
              </button>
            </div>
            <div className="skills-list">
              {employment.skills.map((skill, idx) => (
                <span key={idx} className="skill-tag">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(idx)}
                    className="skill-remove-btn"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <label>Additional Notes (Optional)</label>
          <textarea
            maxLength={500}
            value={employment.description}
            onChange={(e) => setEmployment({ ...employment, description: e.target.value })}
            placeholder="Any additional context about this role..."
            rows={3}
          />
          <p className="text-sm text-gray-500">{employment.description.length}/500 characters</p>

          {employmentError && <p className="error">{employmentError}</p>}
          {employmentSuccess && <p className="success">{employmentSuccess}</p>}

          <div className="button-group">
            <button type="submit" className="btn btn-primary btn-md">
              {editingIndex !== null ? "Update Entry" : "Save Entry"}
            </button>
            <button type="button" className="cancel-btn px-4 py-2 rounded-md border" onClick={handleEmploymentCancel}>
              Cancel
            </button>
          </div>
        </form>

        <h3 className="section-title mt-8">Previous Roles</h3>
        <div className="employment-list">
          {employmentHistory.length === 0 ? (
            <p>No employment history added yet.</p>
          ) : (
            employmentHistory.map((job, index) => {
              console.log(`Rendering job ${index}:`, job.title, job.location);
              return (
              <div
                key={`${job.id}-${refreshKey}`}
                className={`employment-entry ${job.current ? "current-role" : "past-role"}`}
              >
                <div className="employment-header">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 key={`title-${job.id}-${refreshKey}`}>{job.title || 'NO TITLE'}</h4>
                      <p className="company">{job.company} {job.employment_type && `• ${job.employment_type}`}</p>
                      <p className="dates">
                        {formatDate(job.start_date || job.startDate)} – {job.current ? "Present" : formatDate(job.end_date || job.endDate)}
                      </p>
                      {job.location && <p className="location">📍 {job.location}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => moveEntry(index, 'up')}
                        disabled={index === 0}
                        className="text-sm px-2 py-1 border rounded disabled:opacity-30"
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveEntry(index, 'down')}
                        disabled={index === employmentHistory.length - 1}
                        className="text-sm px-2 py-1 border rounded disabled:opacity-30"
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </div>

                {(job.responsibilities && job.responsibilities.length > 0) && (
                  <div className="mt-3">
                    <strong className="text-sm">Key Responsibilities:</strong>
                    <ul className="list-disc ml-5 mt-1">
                      {job.responsibilities.map((resp, idx) => (
                        <li key={idx} className="text-gray-700">{resp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {(job.skills && job.skills.length > 0) && (
                  <div className="mt-3">
                    <strong className="text-sm">Skills & Technologies:</strong>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {job.skills.map((skill, idx) => (
                        <span key={idx} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {job.description && (
                  <p className="description mt-3">{job.description}</p>
                )}

                <div className="button-group mt-4">
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
                    onClick={() => handleDeleteClick(index)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Delete Employment Entry</h3>
            <p className="modal-message">Are you sure you want to delete this employment entry? This action cannot be undone.</p>
            <div className="modal-buttons">
              <button onClick={cancelDelete} className="modal-btn-cancel">
                Cancel
              </button>
              <button onClick={confirmDelete} className="modal-btn-delete">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
