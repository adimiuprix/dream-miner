export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  variant?: "primary" | "secondary";
  onClick?: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export default function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="px-4 grid grid-cols-2 gap-2.5">
      {actions.map((action) => {
        const isPrimary = action.variant === "primary";
        return (
          <button
            key={action.id}
            id={action.id}
            onClick={action.onClick}
            className="flex items-center justify-center gap-2 transition-opacity hover:opacity-85 active:scale-95"
            style={{
              background: isPrimary ? "rgba(0,212,170,0.06)" : "#141414",
              border: isPrimary
                ? "1px solid rgba(0,212,170,0.2)"
                : "1px solid rgba(255,255,255,0.07)",
              borderRadius: "12px",
              padding: "13px 12px",
              fontSize: "13px",
              fontWeight: 600,
              color: isPrimary ? "var(--dm-green)" : "#666",
            }}
          >
            <i className={action.icon} style={{ fontSize: "13px" }} />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
