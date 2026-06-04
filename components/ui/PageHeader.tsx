export default function PageHeader({ title, description, iconClass }: { title: string, description: string, iconClass: string }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>{title}</h1>
        <p className="text-sm mt-0.5 max-w-[180px] leading-snug" style={{ color: "#6b6b6b" }}>
          {description}
        </p>
      </div>
      <div
        className="flex items-center justify-center rounded-xl"
        style={{
          width: 44, height: 44,
          background: "rgba(0,212,170,0.08)",
          border: "1px solid rgba(0,212,170,0.2)",
        }}
      >
        <i className={iconClass} style={{ color: "var(--dm-green)", fontSize: "20px" }} />
      </div>
    </div>
  );
}
