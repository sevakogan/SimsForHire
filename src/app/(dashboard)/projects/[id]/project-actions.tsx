"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProject, generateShareToken } from "@/lib/actions/projects";
import { buttonStyles } from "@/components/ui/form-styles";
import {
  STATUS_ROW_1,
  STATUS_ROW_2,
  STATUS_CONFIG,
} from "@/lib/constants/project-statuses";
import type { Project, ProjectStatus } from "@/types";

interface Props {
  project: Project;
}

export function ProjectActions({ project }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "loading" | "copied">("idle");

  async function handleStatusChange(status: ProjectStatus) {
    if (status === project.status || loading) return;
    setLoading(true);
    await updateProject(project.id, { status });
    router.refresh();
    setLoading(false);
  }

  async function handleShareLink() {
    setShareState("loading");

    try {
      if (project.share_token) {
        const url = `${window.location.origin}/share/${project.share_token}`;
        await navigator.clipboard.writeText(url);
        setShareState("copied");
        setTimeout(() => setShareState("idle"), 2000);
        return;
      }

      const result = await generateShareToken(project.id);
      if (result.error || !result.token) {
        setShareState("idle");
        return;
      }

      const url = `${window.location.origin}/share/${result.token}`;
      await navigator.clipboard.writeText(url);
      setShareState("copied");
      router.refresh();
      setTimeout(() => setShareState("idle"), 2000);
    } catch {
      setShareState("idle");
    }
  }

  function renderStatusButton(status: ProjectStatus) {
    const config = STATUS_CONFIG[status];
    const isActive = project.status === status;

    return (
      <button
        key={status}
        type="button"
        onClick={() => handleStatusChange(status)}
        disabled={loading || isActive}
        className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium transition-all border ${
          isActive
            ? `${config.activeBg} ${config.activeText} border-transparent shadow-sm`
            : `${config.bg} ${config.text} ${config.border} hover:shadow-sm hover:brightness-95`
        } disabled:cursor-default`}
      >
        {config.label}
      </button>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4 w-full">
      {/* Status pills — 2 rows, left */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          {STATUS_ROW_1.map(renderStatusButton)}
        </div>
        <div className="flex items-center gap-1.5">
          {STATUS_ROW_2.map(renderStatusButton)}
        </div>
      </div>

      {/* Share button — right */}
      <button
        type="button"
        onClick={handleShareLink}
        disabled={shareState === "loading"}
        className={`${buttonStyles.secondary} text-xs shrink-0 ${
          shareState === "copied"
            ? "!bg-green-50 !text-green-700 !border-green-200"
            : ""
        }`}
      >
        {shareState === "loading" ? (
          "Generating..."
        ) : shareState === "copied" ? (
          <span className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Link Copied!
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
            Share Invoice
          </span>
        )}
      </button>
    </div>
  );
}
