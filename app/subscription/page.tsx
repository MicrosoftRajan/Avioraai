import { SubscriptionNeo } from "@/components/subscription/SubscriptionNeo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Subscription plans for Aviora interview practice and AI voice learning.",
};

const Subscription = () => {
  return (
    <main className="p-0">
      <SubscriptionNeo />
    </main>
  );
};

export default Subscription;