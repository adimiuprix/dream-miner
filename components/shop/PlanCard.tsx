export interface PowerPlan {
  id: string;
  power: string;
  finalReturn: string;
  price: number;
  bonus: string | null;
  bonusColor: string | null;
}

export default function PlanCard({ plan }: { plan: PowerPlan }) {
  return (
    <button
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
  );
}
