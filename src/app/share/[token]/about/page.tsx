import { notFound } from "next/navigation";
import { getProjectByShareToken } from "@/lib/actions/projects";
import { getCompanyInfo } from "@/lib/actions/company-info";
import { ContactForm } from "@/components/portal/contact-form";
import Image from "next/image";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function AboutPage({ params }: Props) {
  const { token } = await params;
  const [{ project, client }, company] = await Promise.all([
    getProjectByShareToken(token),
    getCompanyInfo(),
  ]);

  if (!project) notFound();

  return (
    <>
      {/* Company Info Header */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          {company.logo_url && (
            <Image
              src={company.logo_url}
              alt={company.name}
              width={56}
              height={56}
              className="shrink-0 h-14 w-14 rounded-xl bg-primary/10 object-contain"
              unoptimized
            />
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              {company.name}
            </h1>
            {company.tagline && (
              <p className="mt-1 text-sm text-gray-600">{company.tagline}</p>
            )}
          </div>
        </div>

        {/* Contact details grid */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {company.address && (
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50">
                <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                {company.address}
              </p>
            </div>
          )}

          <div className="space-y-2.5">
            {company.phone && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                </div>
                <a href={`tel:${company.phone}`} className="text-sm text-gray-600 hover:text-primary transition-colors">
                  {company.phone}
                </a>
              </div>
            )}
            {company.email && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                  <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <a href={`mailto:${company.email}`} className="text-sm text-gray-600 hover:text-primary transition-colors">
                  {company.email}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <section className="mb-8">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          How It Works
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              step: 1,
              title: "Source",
              desc: "Tell us what you need and we find the best options from our network of suppliers.",
              icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              ),
            },
            {
              step: 2,
              title: "Review",
              desc: "Review your personalized quote with detailed pricing and product information.",
              icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                </svg>
              ),
            },
            {
              step: 3,
              title: "Deliver",
              desc: "Once approved, we handle procurement and delivery right to your door.",
              icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              ),
            },
          ].map(({ step, title, desc, icon }) => (
            <div
              key={step}
              className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm"
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                {icon}
              </div>
              <div className="mb-1 text-xs font-medium text-primary">
                Step {step}
              </div>
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="mb-8">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Why Choose Us
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              title: "Below Retail Pricing",
              desc: "Access wholesale and discounted pricing through our supplier network.",
            },
            {
              title: "Curated Selection",
              desc: "We hand-pick quality products that match your exact requirements.",
            },
            {
              title: "Full Transparency",
              desc: "See itemized quotes with detailed pricing — no hidden fees.",
            },
            {
              title: "White-Glove Delivery",
              desc: "From sourcing to your doorstep, we handle the entire process.",
            },
          ].map(({ title, desc }) => (
            <div
              key={title}
              className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-xs text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Form — merged from the old Contact Us page */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Contact Us
        </h2>
        <p className="mb-4 text-xs text-gray-500">
          Have a question or need help? Send us a message.
        </p>
        <div className="mx-auto max-w-lg">
          <ContactForm
            shareToken={token}
            defaultName={client?.name ?? ""}
            defaultEmail={client?.email ?? ""}
          />
        </div>
      </section>
    </>
  );
}
