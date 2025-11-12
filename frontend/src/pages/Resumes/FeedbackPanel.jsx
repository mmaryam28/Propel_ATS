import React, { useState } from "react";

export default function FeedbackPanel() {
  const [feedback, setFeedback] = useState([]);
  const [comment, setComment] = useState("");

  function submitFeedback() {
    if (!comment) return;
    setFeedback([{ text: comment, resolved: false }, ...feedback]);
    setComment("");
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold" style={{ color: "#1e88e5" }}>Resume Feedback</h1>
      <textarea placeholder="Leave your feedback..." value={comment} onChange={e => setComment(e.target.value)} className="border rounded p-2 w-full" />
      <button onClick={submitFeedback}>Submit Feedback</button>
      <ul className="divide-y">
        {feedback.map((f, i) => (
          <li key={i} className="py-2 flex justify-between">
            <span>{f.text}</span>
            <span className="text-sm text-gray-500">{f.resolved ? "Resolved" : "Pending"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
