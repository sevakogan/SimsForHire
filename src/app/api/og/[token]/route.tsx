import { ImageResponse } from "next/og";
import { getProjectByShareToken } from "@/lib/actions/projects";
import { getCompanyInfo } from "@/lib/actions/company-info";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const [{ project, client }, company] = await Promise.all([
    getProjectByShareToken(token),
    getCompanyInfo(),
  ]);

  const companyName = company.name || "SimsForHire";
  const tagline = company.tagline || "Premium sourcing & white-glove delivery";
  const projectName = project?.name ?? "Project";
  const clientName = client?.name ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200",
          height: "630",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Background gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #1e1b4b 100%)",
            display: "flex",
          }}
        />

        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.15))",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(99, 102, 241, 0.08))",
            display: "flex",
          }}
        />

        {/* Accent line at top */}
        <div
          style={{
            width: "100%",
            height: "6px",
            background: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899)",
            display: "flex",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: "60px 70px 50px",
            position: "relative",
          }}
        >
          {/* Top section: Brand */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* Logo mark */}
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, #6366f1, #a855f7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "28px",
                  fontWeight: 800,
                }}
              >
                S
              </div>
              <span
                style={{
                  fontSize: "36px",
                  fontWeight: 800,
                  color: "white",
                  letterSpacing: "-0.5px",
                }}
              >
                {companyName}
              </span>
            </div>
            <span
              style={{
                fontSize: "20px",
                color: "rgba(148, 163, 184, 1)",
                fontWeight: 400,
                maxWidth: "600px",
              }}
            >
              {tagline}
            </span>
          </div>

          {/* Center section: Project card */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "20px",
              padding: "36px 40px",
            }}
          >
            {clientName && (
              <span
                style={{
                  fontSize: "18px",
                  color: "rgba(148, 163, 184, 1)",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                {clientName}
              </span>
            )}
            <span
              style={{
                fontSize: "48px",
                fontWeight: 800,
                color: "white",
                letterSpacing: "-1px",
                lineHeight: 1.1,
              }}
            >
              {projectName}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(99, 102, 241, 0.2)",
                  borderRadius: "50px",
                  padding: "8px 20px",
                }}
              >
                <span style={{ fontSize: "16px", color: "#a5b4fc", fontWeight: 600 }}>
                  Client Portal
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(168, 85, 247, 0.15)",
                  borderRadius: "50px",
                  padding: "8px 20px",
                }}
              >
                <span style={{ fontSize: "16px", color: "#c4b5fd", fontWeight: 600 }}>
                  View Invoice
                </span>
              </div>
            </div>
          </div>

          {/* Bottom section: Features row */}
          <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
            {[
              { label: "Curated Sourcing", icon: "🔍" },
              { label: "Best Prices", icon: "💎" },
              { label: "White-Glove Delivery", icon: "✨" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span style={{ fontSize: "22px" }}>{item.icon}</span>
                <span
                  style={{
                    fontSize: "17px",
                    color: "rgba(203, 213, 225, 0.8)",
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
