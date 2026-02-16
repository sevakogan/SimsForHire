"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateProject } from "@/lib/actions/projects";

interface EditableProjectNameProps {
  projectId: string;
  name: string;
  isAdmin: boolean;
}

export function EditableProjectName({
  projectId,
  name,
  isAdmin,
}: EditableProjectNameProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [localName, setLocalName] = useState(name);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevNameRef = useRef(name);

  // Sync when prop changes (e.g. server revalidation)
  useEffect(() => {
    if (prevNameRef.current !== name) {
      prevNameRef.current = name;
      setLocalName(name);
    }
  }, [name]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => {
        inputRef.current?.select();
      });
    }
  }, [isEditing]);

  const saveName = useCallback(
    async (newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed || trimmed === name) {
        setLocalName(name);
        setIsEditing(false);
        return;
      }
      setIsSaving(true);
      const { error } = await updateProject(projectId, { name: trimmed });
      setIsSaving(false);
      if (error) {
        setLocalName(name);
      } else {
        setLocalName(trimmed);
        router.refresh();
      }
      setIsEditing(false);
    },
    [projectId, name, router]
  );

  const handleBlur = useCallback(() => {
    saveName(localName);
  }, [saveName, localName]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveName(localName);
      } else if (e.key === "Escape") {
        setLocalName(name);
        setIsEditing(false);
      }
    },
    [saveName, localName, name]
  );

  // Non-admin: plain text, no editing
  if (!isAdmin) {
    return (
      <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">
        {name}
      </h1>
    );
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={localName}
        onChange={(e) => setLocalName(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className="text-lg sm:text-2xl font-bold text-foreground bg-transparent border-b-2 border-primary/40 outline-none py-0 px-0 min-w-0 w-full max-w-md transition-colors focus:border-primary"
        aria-label="Project name"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="group flex items-center gap-1.5 min-w-0 max-w-full text-left"
      title="Click to rename"
    >
      <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate group-hover:text-primary/80 transition-colors">
        {localName}
      </h1>
      <svg
        className="h-4 w-4 text-muted-foreground/40 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
        />
      </svg>
    </button>
  );
}
