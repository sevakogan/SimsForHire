export default function PaymentsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-lg sm:text-2xl font-bold text-foreground">
        Payments
      </h1>

      <div className="rounded-xl border border-dashed border-border py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <svg
            className="h-7 w-7 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
            />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-foreground">Coming Soon</h2>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
          Payment tracking will be available soon. Use the invoice links in the
          project for payment details.
        </p>
      </div>
    </div>
  );
}
