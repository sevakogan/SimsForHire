import { getCampaigns } from "@/lib/actions/campaigns";
import { MarketingView } from "@/components/marketing/marketing-view";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const campaigns = await getCampaigns();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Marketing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage email campaigns sent to leads automatically
        </p>
      </div>
      <MarketingView campaigns={campaigns} />
    </div>
  );
}
