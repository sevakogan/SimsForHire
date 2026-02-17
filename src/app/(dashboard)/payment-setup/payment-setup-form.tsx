"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePaymentSettings } from "@/lib/actions/payment-settings";
import type { PaymentSettings, PaymentMethod } from "@/types";

interface PaymentSetupFormProps {
  settings: PaymentSettings;
}

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string; description: string }[] = [
  { value: "card", label: "Credit / Debit Card", description: "Visa, Mastercard, Amex, etc." },
  { value: "us_bank_account", label: "ACH Bank Transfer", description: "Direct bank payments (US only)" },
  { value: "cashapp", label: "Cash App", description: "Cash App Pay" },
  { value: "klarna", label: "Klarna", description: "Pay in 4 installments, pay later" },
  { value: "afterpay_clearpay", label: "Afterpay / Clearpay", description: "Split into 4 interest-free payments" },
];

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm text-gray-900 placeholder:text-gray-400 hover:border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";

export function PaymentSetupForm({ settings }: PaymentSetupFormProps) {
  const router = useRouter();

  const [publishableKey, setPublishableKey] = useState(settings.stripe_publishable_key);
  const [secretKey, setSecretKey] = useState(settings.stripe_secret_key);
  const [webhookSecret, setWebhookSecret] = useState(settings.stripe_webhook_secret);
  const [paymentsEnabled, setPaymentsEnabled] = useState(settings.payments_enabled);
  const [acceptedMethods, setAcceptedMethods] = useState<PaymentMethod[]>(
    settings.accepted_payment_methods
  );
  const [showSecret, setShowSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function toggleMethod(method: PaymentMethod) {
    setAcceptedMethods((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    if (paymentsEnabled && !publishableKey.trim()) {
      setError("Publishable key is required when payments are enabled.");
      setSaving(false);
      return;
    }
    if (paymentsEnabled && !secretKey.trim()) {
      setError("Secret key is required when payments are enabled.");
      setSaving(false);
      return;
    }

    const result = await updatePaymentSettings({
      stripe_publishable_key: publishableKey.trim(),
      stripe_secret_key: secretKey.trim(),
      stripe_webhook_secret: webhookSecret.trim(),
      payments_enabled: paymentsEnabled,
      accepted_payment_methods: acceptedMethods.length > 0 ? acceptedMethods : ["card"],
    });

    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/stripe`
      : "/api/webhooks/stripe";

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Success banner */}
      {success && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Payment settings saved successfully.
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Enable/Disable Toggle */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Accept Online Payments</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              When enabled, clients can pay invoices via the shared link.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPaymentsEnabled(!paymentsEnabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 ${
              paymentsEnabled ? "bg-primary" : "bg-gray-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                paymentsEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Stripe Connection */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-3">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-[#635BFF]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
            </svg>
            <h2 className="text-sm font-semibold text-gray-900">Stripe Connection</h2>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Publishable Key */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Publishable Key
            </label>
            <input
              type="text"
              value={publishableKey}
              onChange={(e) => setPublishableKey(e.target.value)}
              placeholder="pk_live_..."
              className={inputClass}
            />
            <p className="mt-1 text-[10px] text-gray-400">
              Starts with <code className="rounded bg-gray-100 px-1">pk_live_</code> or{" "}
              <code className="rounded bg-gray-100 px-1">pk_test_</code>
            </p>
          </div>

          {/* Secret Key */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Secret Key
            </label>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="sk_live_..."
                className={inputClass + " pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showSecret ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-1 text-[10px] text-gray-400">
              Starts with <code className="rounded bg-gray-100 px-1">sk_live_</code> or{" "}
              <code className="rounded bg-gray-100 px-1">sk_test_</code>
            </p>
          </div>

          {/* Webhook Secret */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Webhook Signing Secret
            </label>
            <div className="relative">
              <input
                type={showWebhookSecret ? "text" : "password"}
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="whsec_..."
                className={inputClass + " pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showWebhookSecret ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-1 text-[10px] text-gray-400">
              Optional. Required for real-time payment status updates.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Payment Methods</h2>
        </div>
        <div className="p-5 space-y-3">
          {PAYMENT_METHOD_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-start gap-3 cursor-pointer rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={acceptedMethods.includes(opt.value)}
                onChange={() => toggleMethod(opt.value)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                <p className="text-xs text-gray-500">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Webhook URL Info */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
        <div className="flex items-start gap-3">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-blue-900">Webhook URL</p>
            <p className="mt-1 text-xs text-blue-700">
              Add this URL in your Stripe Dashboard under Developers → Webhooks:
            </p>
            <code className="mt-2 block truncate rounded-md bg-white px-3 py-2 text-xs text-gray-800 border border-blue-200">
              {webhookUrl}
            </code>
            <p className="mt-2 text-[10px] text-blue-600">
              Listen to these events: <code>checkout.session.completed</code>,{" "}
              <code>checkout.session.expired</code>
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving…
            </>
          ) : (
            "Save Settings"
          )}
        </button>
      </div>
    </form>
  );
}
