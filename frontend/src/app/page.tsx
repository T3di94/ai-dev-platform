export default function HomePage() {
  return (
    <main>
      <section className="container" style={{ padding: "96px 0" }}>
        <p style={{ color: "#94a3b8", marginBottom: 12 }}>AI Dev Platform</p>
        <h1 style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)", lineHeight: 1.05, margin: 0 }}>
          Claude. Devin. Codex.
        </h1>
        <p style={{ maxWidth: 680, color: "#cbd5e1", fontSize: 20, lineHeight: 1.6 }}>
          A production-oriented workspace where frontend, backend, and QA agents work independently through a controlled Git workflow.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 32 }}>
          {[
            ["Claude", "Frontend"],
            ["Devin", "Backend"],
            ["Codex", "QA & Testing"],
          ].map(([agent, role]) => (
            <div key={agent} style={{ border: "1px solid #26324a", borderRadius: 16, padding: 20, minWidth: 180, background: "#11182a" }}>
              <strong>{agent}</strong>
              <div style={{ color: "#94a3b8", marginTop: 6 }}>{role}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
