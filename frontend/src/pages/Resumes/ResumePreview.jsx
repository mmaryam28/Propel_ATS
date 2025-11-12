import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function ResumePreview() {
  const { id } = useParams();
  const [resume, setResume] = useState(null);
  const [validation, setValidation] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:3000/resume/${id}`).then(res => res.json()).then(setResume);
  }, [id]);

  async function validate() {
    const res = await fetch("http://localhost:3000/resume/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userProfile: resume }),
    });
    const data = await res.json();
    setValidation(data.validation || data);
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold" style={{ color: "#1e88e5" }}>Resume Preview</h1>
      {resume && (
        <div className="border rounded-xl p-4">
          <pre>{JSON.stringify(resume, null, 2)}</pre>
        </div>
      )}
      <button onClick={validate}>Validate Resume</button>
      {validation && (
        <div className="bg-gray-50 p-4 rounded-lg mt-4 text-sm">
          <h3 className="font-semibold">Validation Results</h3>
          <pre>{JSON.stringify(validation, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
