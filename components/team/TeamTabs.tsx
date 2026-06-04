export default function TeamTabs({ activeTab, setActiveTab }: { activeTab: "members" | "power-log", setActiveTab: (tab: "members" | "power-log") => void }) {
  return (
    <div className="grid grid-cols-2 mb-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      {(["members", "power-log"] as const).map((tab) => (
        <button
          key={tab}
          id={`tab-${tab}`}
          onClick={() => setActiveTab(tab)}
          className="py-3 text-sm font-semibold capitalize transition-colors"
          style={{
            color: activeTab === tab ? "var(--dm-green)" : "#555",
            borderBottom: activeTab === tab ? "2px solid var(--dm-green)" : "2px solid transparent",
          }}
        >
          {tab === "members" ? "Members" : "POWER Log"}
        </button>
      ))}
    </div>
  );
}
