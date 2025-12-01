import React, { useState } from 'react';

const TABS = ['Overview', 'Company Research', 'Question Bank', 'Mock Interview', 'Technical Prep', 'Checklist'];

export default function InterviewPrepPanel({ open, onClose, interview, prep, loading, error }) {
  const [activeTab, setActiveTab] = useState('Overview');

  if (!open || !interview) return null;

  const companyName = interview.company_name || interview.job?.company || 'Company';
  const roleTitle = interview.job_title || interview.title || interview.job?.title || 'Role';

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="w-full max-w-xl h-full bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Interview prep
            </h2>
            <p className="text-sm text-gray-600">
              {roleTitle} at {companyName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
            aria-label="Close"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-3 border-b">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs rounded-full border ${
                  activeTab === tab
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 text-sm">
          {loading && (
            <div className="text-gray-600">Generating prep for this interview...</div>
          )}

          {error && !loading && (
            <div className="text-red-600">Could not load prep: {error}</div>
          )}

          {!loading && !error && prep && (
            <>
              {activeTab === 'Overview' && (
                <div className="space-y-3">
                  <p className="text-gray-700">
                    This panel gives you everything you need to prepare for this interview in one place.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>High level company research and talking points</li>
                    <li>Role specific question bank</li>
                    <li>Mock interview questions you can practice with</li>
                    <li>Technical prep prompts and solution outlines</li>
                    <li>A practical checklist that you can skim before the interview</li>
                  </ul>
                  <div className="mt-4 p-3 border rounded-md bg-gray-50">
                    <div className="font-medium text-gray-900 mb-1">Interview details</div>
                    <div className="text-gray-700">
                      <div>
                        Date and time:{' '}
                        {new Date(interview.scheduled_at).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </div>
                      {interview.location && <div>Location: {interview.location}</div>}
                      {interview.interviewer_name && (
                        <div>Interviewer: {interview.interviewer_name}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Company Research' && (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-gray-800 bg-gray-50 p-3 rounded-md border">
                    {prep.companyResearch}
                  </pre>
                </div>
              )}

              {activeTab === 'Question Bank' && (
                <div className="space-y-4">
                  {Object.entries(prep.questionBank).map(([category, questions]) => (
                    <div key={category}>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {questions.map((q, idx) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'Mock Interview' && (
                <div className="space-y-3">
                  <p className="text-gray-700">{prep.mockInterview.intro}</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-800">
                    {prep.mockInterview.questions.map((q) => (
                      <li key={q.id}>
                        <span className="font-medium text-gray-900">[{q.type}] </span>
                        {q.text}
                      </li>
                    ))}
                  </ol>
                  <p className="text-gray-700 mt-3">{prep.mockInterview.summary}</p>
                </div>
              )}

              {activeTab === 'Technical Prep' && (
                <div className="space-y-4">
                  <p className="text-gray-700">{prep.technicalPrep.overview}</p>
                  <div className="p-3 border rounded-md bg-gray-50">
                    <div className="font-semibold text-gray-900 mb-1">Coding challenge</div>
                    <div className="text-gray-800 mb-2">{prep.technicalPrep.codingChallenge.prompt}</div>
                    <div className="text-gray-700 text-xs mb-1">
                      Hint: {prep.technicalPrep.codingChallenge.hint}
                    </div>
                    <div className="text-gray-700 text-xs">
                      Solution outline: {prep.technicalPrep.codingChallenge.solutionOutline}
                    </div>
                  </div>
                  <div className="p-3 border rounded-md bg-gray-50">
                    <div className="font-semibold text-gray-900 mb-1">System design</div>
                    <div className="text-gray-800 mb-2">{prep.technicalPrep.systemDesign.prompt}</div>
                    <ul className="list-disc list-inside text-gray-700 text-xs space-y-1">
                      {prep.technicalPrep.systemDesign.keyPoints.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'Checklist' && (
                <div className="space-y-3">
                  <p className="text-gray-700">
                    Use this checklist the day before and the day of the interview.
                  </p>
                  <ul className="space-y-2">
                    {prep.checklist.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start gap-2 p-2 border rounded-md bg-gray-50"
                      >
                        <div className="mt-0.5">
                          <input type="checkbox" className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-gray-800">{item.label}</div>
                          <div className="text-xs text-gray-500">
                            {item.category}
                            {item.suggestedTime && ` • ${item.suggestedTime}`}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
