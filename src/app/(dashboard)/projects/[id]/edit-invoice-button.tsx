"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProject } from "@/lib/actions/projects";
import { buttonStyles } from "@/components/ui/form-styles";

interface EditInvoiceButtonProps {
  projectId: string;
}

export function EditInvoiceButton({ projectId }: EditInvoiceButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);

  function handleClick() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }

    startTransition(async () => {
      // Revert to "quote" so the invoice becomes editable again
      await updateProject(projectId, { status: "quote" });
      router.refresh();
      setConfirmed(false);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`${buttonStyles.secondary} text-xs ${
          confirmed
            ? "!bg-amber-50 !text-amber-700 !border-amber-300 hover:!bg-amber-100"
            : ""
        }`}
      >
        {isPending ? (
          "Unlocking..."
        ) : confirmed ? (
          <span className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            Confirm — this will unlock the invoice
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            Edit The Invoice
          </span>
        )}
      </button>
      {confirmed && !isPending && (
        <button
          type="button"
          onClick={() => setConfirmed(false)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
