"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateProject, deleteProject } from "@/lib/actions/projects";
import { Badge } from "@/components/ui/badge";
import { buttonStyles, formStyles } from "@/components/ui/form-styles";
import type { Project, FulfillmentType } from "@/types";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <>
      <Link
        href={`/projects/${project.id}`}
        className="flex items-center justify-between rounded-xl border border-border bg-white p-3.5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md sm:p-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm sm:text-base font-medium text-foreground truncate">
              {project.name}
            </p>
            <FulfillmentBadge type={project.fulfillment_type} />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2 ml-3 shrink-0">
          <Badge variant={project.status}>{project.status}</Badge>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowEdit(true);
            }}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Edit project"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
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
      </Link>

      {showEdit && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEdit(false)}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmModal
          projectName={project.name}
          projectId={project.id}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}

function FulfillmentBadge({ type }: { type: FulfillmentType | undefined }) {
  const fulfillment = type ?? "delivery";
  const isPickup = fulfillment === "pickup";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
        isPickup
          ? "bg-amber-50 text-amber-700"
          : "bg-blue-50 text-blue-700"
      }`}
    >
      {isPickup ? (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      ) : (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      )}
      {isPickup ? "Pickup" : "Delivery"}
    </span>
  );
}

function EditProjectModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [dateRequired, setDateRequired] = useState(project.date_required ?? "");
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>(
    project.fulfillment_type ?? "delivery"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const result = await updateProject(project.id, {
        name: trimmedName,
        date_required: dateRequired || null,
        fulfillment_type: fulfillmentType,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-base font-semibold text-foreground">
          Edit Project
        </h3>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className={formStyles.group}>
            <label htmlFor="edit-name" className={formStyles.label}>
              Name *
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className={formStyles.input}
            />
          </div>

          <div className={formStyles.group}>
            <label className={formStyles.label}>Date Created</label>
            <input
              type="text"
              value={new Date(project.created_at).toLocaleDateString()}
              disabled
              className={`${formStyles.input} cursor-not-allowed opacity-60`}
            />
          </div>

          <div className={formStyles.group}>
            <label htmlFor="edit-date-required" className={formStyles.label}>
              Date Required
            </label>
            <input
              id="edit-date-required"
              type="date"
              value={dateRequired}
              onChange={(e) => setDateRequired(e.target.value)}
              className={formStyles.input}
            />
          </div>

          <div className={formStyles.group}>
            <label className={formStyles.label}>Fulfillment</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFulfillmentType("delivery")}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                  fulfillmentType === "delivery"
                    ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                    : "border-border bg-white text-muted-foreground hover:bg-muted"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                  Delivery
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFulfillmentType("pickup")}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                  fulfillmentType === "pickup"
                    ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                    : "border-border bg-white text-muted-foreground hover:bg-muted"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                  Pickup
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={buttonStyles.secondary}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={buttonStyles.primary}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  projectName,
  projectId,
  onClose,
}: {
  projectName: string;
  projectId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isConfirmed = confirmText.toLowerCase() === "delete";

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const result = await deleteProject(projectId);
      if (result.error) {
        setError(result.error);
        setDeleting(false);
        return;
      }
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
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
              This will permanently delete{" "}
              <span className="font-medium text-foreground">{projectName}</span>{" "}
              and all its items.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Type <span className="font-semibold text-red-600">delete</span> to
            confirm
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
            type="button"
            onClick={onClose}
            disabled={deleting}
            className={buttonStyles.secondary}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
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
