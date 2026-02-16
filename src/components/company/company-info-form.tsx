"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { updateCompanyInfo, type CompanyInfo } from "@/lib/actions/company-info";
import { uploadImage } from "@/lib/actions/upload";
import { isExternalImage } from "@/lib/parse-images";

interface CompanyInfoFormProps {
  info: CompanyInfo;
}

export function CompanyInfoForm({ info }: CompanyInfoFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(info.name);
  const [tagline, setTagline] = useState(info.tagline);
  const [phone, setPhone] = useState(info.phone);
  const [email, setEmail] = useState(info.email);
  const [address, setAddress] = useState(info.address);
  const [ein, setEin] = useState(info.ein);
  const [logoUrl, setLogoUrl] = useState(info.logo_url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Logo must be under 2MB");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadImage(formData);

    if (result.error) {
      setError(result.error);
    } else if (result.url) {
      setLogoUrl(result.url);
    }
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const result = await updateCompanyInfo({
      name: name.trim(),
      tagline: tagline.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      ein: ein.trim(),
      logo_url: logoUrl.trim() || null,
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

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm text-gray-900 placeholder:text-gray-400 hover:border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
          Company info saved successfully.
        </div>
      )}

      {/* Logo upload */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <label className="mb-3 block text-sm font-semibold text-gray-900">
          Company Logo
        </label>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <div className="relative h-20 w-20 shrink-0 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
              <Image
                src={logoUrl}
                alt="Logo"
                fill
                className="object-contain p-1"
                unoptimized={isExternalImage(logoUrl)}
              />
            </div>
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
              <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
            </div>
          )}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  Upload Logo
                </>
              )}
            </button>
            <p className="text-xs text-gray-400">PNG, JPG or WebP. Max 2MB.</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Info fields */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <label htmlFor="ci-name" className="mb-1 block text-sm font-medium text-gray-700">
            Company Name
          </label>
          <input
            id="ci-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your company name"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="ci-tagline" className="mb-1 block text-sm font-medium text-gray-700">
            Tagline
          </label>
          <input
            id="ci-tagline"
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Short description of your business"
            className={inputClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ci-phone" className="mb-1 block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              id="ci-phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ci-email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="ci-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@company.com"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="ci-address" className="mb-1 block text-sm font-medium text-gray-700">
            Address
          </label>
          <textarea
            id="ci-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street address, city, state, zip"
            rows={2}
            className={`${inputClass} resize-y`}
          />
        </div>

        <div>
          <label htmlFor="ci-ein" className="mb-1 block text-sm font-medium text-gray-700">
            EIN
          </label>
          <input
            id="ci-ein"
            type="text"
            value={ein}
            onChange={(e) => setEin(e.target.value)}
            placeholder="XX-XXXXXXX"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-400">
            Employer Identification Number (optional)
          </p>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {saving && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
