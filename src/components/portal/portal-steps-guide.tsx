"use client";

import { useState } from "react";

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    number: 1,
    title: "Review",
    description: "Look through each item on your invoice.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    ),
  },
  {
    number: 2,
    title: "Decide",
    description: "Approve, remove, or leave a note on items.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    number: 3,
    title: "Sign",
    description: "Read and sign the purchase agreement.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
      </svg>
    ),
  },
  {
    number: 4,
    title: "Pay",
    description: "Submit a payment for your order.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
      </svg>
    ),
  },
  {
    number: 5,
    title: "Track",
    description: "Follow your shipment until it arrives.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
];

/** Determine which step is "current" based on project status */
function getCurrentStep(
  projectStatus: string,
  contractSignedAt: string | null
): number {
  // Map status to step
  if (["draft", "quote", "submitted"].includes(projectStatus)) return 1;
  if (projectStatus === "accepted" && !contractSignedAt) return 3;
  if (projectStatus === "accepted" && contractSignedAt) return 4;
  if (projectStatus === "paid" || projectStatus === "preparing") return 5;
  if (["shipped", "received", "completed"].includes(projectStatus)) return 5;
  return 1;
}

interface PortalStepsGuideProps {
  projectStatus: string;
  contractSignedAt: string | null;
}

export function PortalStepsGuide({
  projectStatus,
  contractSignedAt,
}: PortalStepsGuideProps) {
  const currentStep = getCurrentStep(projectStatus, contractSignedAt);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Your Journey
      </p>

      {/* Steps row */}
      <div className="flex items-start gap-1 sm:gap-2">
        {STEPS.map((step, idx) => {
          const isComplete = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isExpanded = expandedStep === step.number;

          return (
            <div key={step.number} className="flex flex-1 flex-col items-center">
              {/* Connector line + circle */}
              <div className="flex w-full items-center">
                {/* Left connector */}
                {idx > 0 && (
                  <div
                    className={`h-0.5 flex-1 transition-colors duration-500 ${
                      isComplete || isCurrent ? "bg-primary" : "bg-gray-200"
                    }`}
                  />
                )}
                {idx === 0 && <div className="flex-1" />}

                {/* Circle */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedStep(isExpanded ? null : step.number)
                  }
                  className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 sm:h-10 sm:w-10 ${
                    isComplete
                      ? "border-primary bg-primary text-white"
                      : isCurrent
                        ? "border-primary bg-primary/10 text-primary ring-4 ring-primary/10"
                        : "border-gray-200 bg-white text-gray-400"
                  }`}
                >
                  {isComplete ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  ) : (
                    step.icon
                  )}

                  {/* Pulse animation for current step */}
                  {isCurrent && (
                    <span className="absolute inset-0 animate-ping rounded-full border-2 border-primary opacity-20" />
                  )}
                </button>

                {/* Right connector */}
                {idx < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 transition-colors duration-500 ${
                      isComplete ? "bg-primary" : "bg-gray-200"
                    }`}
                  />
                )}
                {idx === STEPS.length - 1 && <div className="flex-1" />}
              </div>

              {/* Label */}
              <p
                className={`mt-1.5 text-center text-[10px] font-medium leading-tight sm:text-xs ${
                  isComplete || isCurrent
                    ? "text-primary"
                    : "text-gray-400"
                }`}
              >
                {step.title}
              </p>

              {/* Expanded description with animation */}
              <div
                className={`overflow-hidden text-center transition-all duration-300 ease-out ${
                  isExpanded
                    ? "mt-1 max-h-20 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-[10px] leading-snug text-gray-500 sm:text-xs">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
