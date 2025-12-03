import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const TABS = [
  'Overview',
  'Company Research',
  'Question Bank',
  'Mock Interview',
  'Technical Prep',
  'Checklist',
];

export default function InterviewPrepPanel({
  open,
  onClose,
  interview,
  prep,
  loading,
  error,
}) {
  const [activeTab, setActiveTab] = useState('Overview');

  if (!open || !interview) return null;

  const companyName =
    interview.company_name || interview.job?.company || 'Company';
  const roleTitle =
    interview.job_title || interview.title || interview.job?.title || 'Role';

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
          <div className="flex items-center gap-3">
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
          {/* Single, simple loading box you asked to keep */}
          {loading && (
            <div className="mb-3 rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-gray-700">
              Generating prep for this interview...
            </div>
          )}

          {error && !loading && (
            <div className="text-red-600 mb-2">
              Could not load prep: {error}
            </div>
          )}

          {!loading && !error && prep && (
            <>
              {/* OVERVIEW */}
              {activeTab === 'Overview' && (
                <div className="space-y-3">
                  <p className="text-gray-700">
                    This panel gives you everything you need to prepare for this
                    interview in one place.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>High level company research and talking points</li>
                    <li>Role specific interview questions</li>
                    <li>Mock interview question flow</li>
                    <li>Technical prep prompts and frameworks</li>
                    <li>A practical checklist to skim before the interview</li>
                  </ul>

                  <div className="mt-4 p-3 border rounded-md bg-gray-50">
                    <div className="font-medium text-gray-900 mb-1">
                      Interview details
                    </div>
                    <div className="text-gray-700 space-y-1">
                      <div>
                        Date and time:{' '}
                        {new Date(
                          interview.scheduled_at,
                        ).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </div>
                      {interview.location && (
                        <div>Location: {interview.location}</div>
                      )}
                      {interview.interviewer_name && (
                        <div>Interviewer: {interview.interviewer_name}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* COMPANY RESEARCH */}
              {activeTab === 'Company Research' && (
                <div className="space-y-3">
                  <div className="rounded-lg border bg-gray-50 p-3">
                    <ReactMarkdown className="prose prose-sm max-w-none">
                      {prep.companyResearch}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* QUESTION BANK */}
              {activeTab === 'Question Bank' && (
                <div className="space-y-4">
                  {Object.entries(prep.questionBank).map(
                    ([category, questions]) => (
                      <div
                        key={category}
                        className="border rounded-lg bg-gray-50 p-3"
                      >
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {category.charAt(0).toUpperCase() +
                            category.slice(1)}
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          {questions.map((q, idx) => (
                            <li key={idx}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    ),
                  )}
                </div>
              )}

              {/* MOCK INTERVIEW */}
              {activeTab === 'Mock Interview' && (
                <div className="space-y-3">
                  <div className="border rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-700 mb-2">
                      {prep.mockInterview.intro}
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-800">
                      {prep.mockInterview.questions.map((q) => (
                        <li key={q.id}>
                          <span className="font-medium text-gray-900">
                            [{q.type}]&nbsp;
                          </span>
                          {q.text}
                        </li>
                      ))}
                    </ol>
                    <p className="text-gray-700 mt-3">
                      {prep.mockInterview.summary}
                    </p>
                  </div>
                </div>
              )}

              {/* TECHNICAL PREP */}
              {activeTab === 'Technical Prep' && (
                <div className="space-y-4">
                  <div className="border rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-700 mb-2">
                      {prep.technicalPrep.overview}
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg bg-gray-50 space-y-1">
                    <div className="font-semibold text-gray-900">
                      Coding challenge
                    </div>
                    <div className="text-gray-800">
                      {prep.technicalPrep.codingChallenge.prompt}
                    </div>
                    <div className="text-gray-700 text-xs">
                      <span className="font-semibold">Hint:</span>{' '}
                      {prep.technicalPrep.codingChallenge.hint}
                    </div>
                    <div className="text-gray-700 text-xs">
                      <span className="font-semibold">Solution outline:</span>{' '}
                      {prep.technicalPrep.codingChallenge.solutionOutline}
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg bg-gray-50 space-y-1">
                    <div className="font-semibold text-gray-900">
                      System design
                    </div>
                    <div className="text-gray-800">
                      {prep.technicalPrep.systemDesign.prompt}
                    </div>
                    <ul className="list-disc list-inside text-gray-700 text-xs space-y-1 mt-1">
                      {prep.technicalPrep.systemDesign.keyPoints.map(
                        (p, idx) => (
                          <li key={idx}>{p}</li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* CHECKLIST */}
              {activeTab === 'Checklist' && (
                <div className="space-y-3">
                  <p className="text-gray-700">
                    Use this checklist the day before and the day of the
                    interview.
                  </p>
                  <ul className="space-y-2">
                    {prep.checklist.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start gap-2 p-2 border rounded-md bg-gray-50"
                      >
                        <input type="checkbox" className="mt-1 h-4 w-4" />
                        <div>
                          <div className="text-gray-800">{item.label}</div>
                          <div className="text-xs text-gray-500">
                            {item.category}
                            {item.suggestedTime &&
                              ` • ${item.suggestedTime}`}
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
