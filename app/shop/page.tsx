"use client";

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
    <div className="flex flex-col min-h-full px-4 pt-4" style={{ background: "var(--background)" }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>Shop</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6b6b6b" }}>Buy POWER and grow faster.</p>
        </div>
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            width: 44, height: 44,
            background: "rgba(0,212,170,0.08)",
            border: "1px solid rgba(0,212,170,0.2)",
          }}
        >
          <i className="fa-solid fa-cart-shopping" style={{ color: "var(--dm-green)", fontSize: "20px" }} />
        </div>
      </div>

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
          <button
            key={plan.id}
            id={plan.id}
            className="flex items-center justify-between w-full rounded-2xl px-4 py-4 text-left transition-all duration-200"
            style={{
              background: "#161616",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,212,170,0.2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
            }}
          >
            {/* Left: power info */}
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold" style={{ color: "#fff" }}>
                  {plan.power}
                </span>
                <span
                  className="text-xs font-bold tracking-widest"
                  style={{ color: "#555" }}
                >
                  POWER
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <i className="fa-regular fa-clock" style={{ color: "#555", fontSize: "11px" }} />
                <span className="text-xs" style={{ color: "#6b6b6b" }}>
                  Final return: {plan.finalReturn}
                </span>
              </div>
            </div>

            {/* Right: bonus + price */}
            <div className="flex items-center gap-2">
              {plan.bonus && (
                <span
                  className="text-xs font-bold px-2 py-1 rounded-lg"
                  style={{
                    background: plan.bonusColor + "22",
                    color: plan.bonusColor!,
                    border: `1px solid ${plan.bonusColor}44`,
                  }}
                >
                  {plan.bonus}
                </span>
              )}
              <div
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm"
                style={{
                  background: "#1e1e1e",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  minWidth: 60,
                  justifyContent: "center",
                }}
              >
                {plan.price}
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 18, height: 18,
                    background: "#0088cc",
                  }}
                >
                  <i className="fa-solid fa-diamond" style={{ fontSize: "8px", color: "#fff" }} />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-6 pb-4">
        <div className="flex items-center gap-2 text-xs" style={{ color: "#555" }}>
          <i className="fa-solid fa-lock" style={{ fontSize: "11px" }} />
          Secure payments on TON blockchain.
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--dm-green)" }}>
          <div className="flex items-center justify-center rounded-full" style={{ width: 16, height: 16, background: "#0088cc" }}>
            <i className="fa-solid fa-diamond" style={{ fontSize: "7px", color: "#fff" }} />
          </div>
          Secured by TON
        </div>
      </div>
    </div>
  );
}
