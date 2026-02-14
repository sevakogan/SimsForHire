"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateProject, deleteProject } from "@/lib/actions/projects";
import { Badge } from "@/components/ui/badge";
import { buttonStyles, formStyles } from "@/components/ui/form-styles";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [name, setName] = useState(project.name);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming]);

  async function handleRename() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === project.name) {
      setName(project.name);
      setRenaming(false);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await updateProject(project.id, { name: trimmed });
      if (result.error) {
        setError(result.error);
        return;
      }
      setRenaming(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const result = await deleteProject(project.id);
      if (result.error) {
        setError(result.error);
        setDeleting(false);
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRename();
    } else if (e.key === "Escape") {
      setName(project.name);
      setRenaming(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between rounded-xl border border-border bg-white p-3.5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md sm:p-5">
        <Link href={`/projects/${project.id}`} className="min-w-0 flex-1">
          {renaming ? null : (
            <div>
              <p className="text-sm sm:text-base font-medium text-foreground truncate">
                {project.name}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </Link>

        {renaming && (
          <div className="min-w-0 flex-1 mr-2" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleRename}
              disabled={saving}
              className={`${formStyles.input} !py-1.5 text-sm`}
            />
          </div>
        )}

        <div className="flex items-center gap-2 ml-3 shrink-0">
          <Badge variant={project.status}>{project.status}</Badge>

          {!renaming && (
            <button
              onClick={(e) => {
                e.preventDefault();
                setRenaming(true);
              }}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Rename project"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
            </button>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              setShowDeleteConfirm(true);
            }}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
            title="Delete project"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          projectName={project.name}
          deleting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}

function DeleteConfirmModal({
  projectName,
  deleting,
  onConfirm,
  onCancel,
}: {
  projectName: string;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const isConfirmed = confirmText.toLowerCase() === "delete";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Delete Project
            </h3>
            <p className="text-sm text-muted-foreground">
              This will permanently delete <span className="font-medium text-foreground">{projectName}</span> and all its items.
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Type <span className="font-semibold text-red-600">delete</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete"
            autoFocus
            className={formStyles.input}
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className={buttonStyles.secondary}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!isConfirmed || deleting}
            className={buttonStyles.danger}
          >
            {deleting ? "Deleting..." : "Delete Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
