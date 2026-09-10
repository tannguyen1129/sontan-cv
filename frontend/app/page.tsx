import { Portfolio } from "@/components/portfolio";
import { demoData } from "@/lib/data";
import { PortfolioData } from "@/lib/types";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/$/, "");

async function getBuildSnapshot(): Promise<PortfolioData> {
  try {
    const response = await fetch(`${API}/`, {
      signal: AbortSignal.timeout(75_000),
    });
    if (!response.ok) return demoData;
    const data = await response.json();
    return { ...demoData, ...data, profile: data.profile || demoData.profile };
  } catch {
    return demoData;
  }
}

export default async function Home() {
  return <Portfolio initialData={await getBuildSnapshot()} />;
}
