export default function EmptyState({ title, description, iconClass }: { title: string, description: string, iconClass: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: 64, height: 64,
          background: "rgba(0,212,170,0.08)",
          border: "1px solid rgba(0,212,170,0.15)",
        }}
      >
        <i className={iconClass} style={{ color: "var(--dm-green)", fontSize: "26px" }} />
      </div>
      <p className="font-bold" style={{ color: "#fff" }}>{title}</p>
      <p className="text-sm text-center" style={{ color: "#6b6b6b" }}>
        {description}
      </p>
    </div>
  );
}
