export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          SimsForHire
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Your trusted partner for sourcing quality products at the best prices.
        </p>
      </div>

      {/* What We Do */}
      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-gray-900">
          What We Do
        </h2>
        <p className="text-sm leading-relaxed text-gray-600">
          We specialize in finding, sourcing, and delivering the products you
          need. Whether it&apos;s furniture, electronics, appliances, or
          specialty items, we leverage our network of suppliers and deep
          industry knowledge to get you the best deals — often well below
          retail price.
        </p>
      </section>

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
      <section>
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
    </>
  );
}
