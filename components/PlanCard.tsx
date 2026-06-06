export interface PowerPlan {
  id: string;
  name: string;         // "118K", "600K", etc.
  slug: string;
  power: number;        // 118000, 600000, etc.
  bonus: number;        // bonus power value
  bonusPercent: number;
  price: number;
  duration: number;
  description: string | null;
  finalReturn: string | null; // "1.100 TON", etc.
  badge: string | null;       // "+60K POWER", etc.
  badgeColor: string | null;
  order: number;
}

interface PlanCardProps {
  plan: PowerPlan;
  onPurchase?: (planId: string) => void;
  loading?: boolean;
}

export default function PlanCard({ plan, onPurchase, loading = false }: PlanCardProps) {
  const handleClick = () => {
    if (onPurchase && !loading) {
      onPurchase(plan.id);
    }
  };

  return (
    <button
      id={plan.slug}
      onClick={handleClick}
      disabled={loading}
      className="flex items-center justify-between w-full rounded-2xl px-4 py-4 text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: "#161616",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,212,170,0.2)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
      }}
    >
      {/* Left: power info */}
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-extrabold" style={{ color: "#fff" }}>
            {plan.name}
          </span>
          <span
            className="text-xs font-bold tracking-widest"
            style={{ color: "#555" }}
          >
            POWER
          </span>
        </div>
        {plan.finalReturn && (
          <div className="flex items-center gap-1.5 mt-1">
            <i className="fa-regular fa-clock" style={{ color: "#555", fontSize: "11px" }} />
            <span className="text-xs" style={{ color: "#6b6b6b" }}>
              Final return: {plan.finalReturn}
            </span>
          </div>
        )}
      </div>

      {/* Right: bonus + price */}
      <div className="flex items-center gap-2">
        {loading && (
          <div
            className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--dm-green)", borderTopColor: "transparent" }}
          />
        )}
        {plan.badge && (
          <span
            className="text-xs font-bold px-2 py-1 rounded-lg"
            style={{
              background: plan.badgeColor + "22",
              color: plan.badgeColor!,
              border: `1px solid ${plan.badgeColor}44`,
            }}
          >
            {plan.badge}
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
