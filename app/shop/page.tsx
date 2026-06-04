"use client";

import PageHeader from "@/components/ui/PageHeader";
import PlanCard from "@/components/shop/PlanCard";
import ShopFooter from "@/components/shop/ShopFooter";

const plans = [
  {
    id: "plan-118k",
    power: "118K",
    finalReturn: "1.100 TON",
    price: 1,
    bonus: null,
    bonusColor: null,
  },
  {
    id: "plan-600k",
    power: "600K",
    finalReturn: "5.610 TON",
    price: 5,
    bonus: "+11.8K POWER",
    bonusColor: "#00d4aa",
  },
  {
    id: "plan-1m2",
    power: "1.2M",
    finalReturn: "11.550 TON",
    price: 10,
    bonus: "+58.8K POWER",
    bonusColor: "#8b5cf6",
  },
  {
    id: "plan-3m7",
    power: "3.7M",
    finalReturn: "34.375 TON",
    price: 25,
    bonus: "+735K POWER",
    bonusColor: "#8b5cf6",
  },
  {
    id: "plan-17m6",
    power: "17.6M",
    finalReturn: "165.000 TON",
    price: 100,
    bonus: "+5.9M POWER",
    bonusColor: "#f5a623",
  },
];

export default function ShopPage() {
  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-20" style={{ background: "var(--background)" }}>
      <PageHeader 
        title="Shop" 
        description="Buy POWER and grow faster." 
        iconClass="fa-solid fa-cart-shopping" 
      />

      {/* Tab */}
      <div className="mb-4">
        <button
          id="tab-buy-power"
          className="flex items-center gap-2 pb-2 text-sm font-semibold"
          style={{
            color: "var(--dm-green)",
            borderBottom: "2px solid var(--dm-green)",
          }}
        >
          <i className="fa-solid fa-bolt" />
          Buy Power
        </button>
      </div>

      {/* Plans list */}
      <div className="flex flex-col gap-3">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>

      <ShopFooter />
    </div>
  );
}
