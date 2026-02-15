export default function PaymentsPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
          Payments
        </h1>
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <svg
            className="h-7 w-7 text-gray-400"
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
        <h2 className="text-base font-semibold text-gray-700">Coming Soon</h2>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-gray-500">
          Online payments will be available soon. In the meantime, please
          reference the invoice links in your project for payment details.
        </p>
      </div>
    </>
  );
}
