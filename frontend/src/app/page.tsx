"use client";

import { FormEvent, useMemo, useState } from "react";
import { agents } from "../lib/platform";

const initialTasks = [
  { id: 1, title: "Build authentication flow", agent: "Claude", status: "In progress" },
  { id: 2, title: "Design API health endpoint", agent: "Devin", status: "Ready" },
  { id: 3, title: "Run regression suite", agent: "Codex", status: "Ready" },
];

export default function HomePage() {
  const [tasks, setTasks] = useState(initialTasks);
  const [task, setTask] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("Claude");
  const [message, setMessage] = useState("All systems operational");

  const counts = useMemo(() => ({
    total: tasks.length,
    active: tasks.filter((item) => item.status === "In progress").length,
    ready: tasks.filter((item) => item.status === "Ready").length,
  }), [tasks]);

  function createTask(event: FormEvent) {
    event.preventDefault();
    const title = task.trim();
    if (!title) {
      setMessage("Enter a task before creating it.");
      return;
    }
    setTasks((current) => [
      { id: Date.now(), title, agent: selectedAgent, status: "Ready" },
      ...current,
    ]);
    setTask("");
    setMessage(`Task assigned to ${selectedAgent}.`);
  }

  function runTask(id: number) {
    setTasks((current) => current.map((item) => item.id === id ? { ...item, status: "In progress" } : item));
    setMessage("Task execution started.");
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">AI DEV PLATFORM</div>
          <h1>Agent Workspace</h1>
        </div>
        <div className="status-pill"><span /> {message}</div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">ORCHESTRATED DEVELOPMENT</p>
          <h2>Ship software with specialized AI agents.</h2>
          <p className="muted">Create work, route it to the right agent, monitor execution, and keep quality gates visible in one workspace.</p>
        </div>
        <div className="stats">
          <div><strong>{counts.total}</strong><span>Total tasks</span></div>
          <div><strong>{counts.active}</strong><span>Running</span></div>
          <div><strong>{counts.ready}</strong><span>Ready</span></div>
        </div>
      </section>

      <section className="agents-grid">
        {agents.map((agent) => (
          <article className="agent-card" key={agent.name}>
            <div className="agent-head"><span className="agent-dot" /><span className="agent-status">ONLINE</span></div>
            <h3>{agent.name}</h3>
            <p>{agent.role}</p>
            <div className="progress"><span /></div>
            <small>Ready for assigned work</small>
          </article>
        ))}
      </section>

      <section className="workspace-grid">
        <article className="panel">
          <div className="panel-title"><div><span className="eyebrow">TASK QUEUE</span><h3>Create work</h3></div></div>
          <form onSubmit={createTask} className="task-form">
            <input value={task} onChange={(e) => setTask(e.target.value)} placeholder="Describe a task..." aria-label="Task description" />
            <select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)} aria-label="Assign agent">
              {agents.map((agent) => <option key={agent.name}>{agent.name}</option>)}
            </select>
            <button type="submit">Create task</button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-title"><div><span className="eyebrow">QUALITY GATES</span><h3>Delivery health</h3></div></div>
          <div className="checks">
            <div><span>CI pipeline</span><b>PASS</b></div>
            <div><span>TypeScript</span><b>PASS</b></div>
            <div><span>Automated tests</span><b>PASS</b></div>
            <div><span>GitHub Pages</span><b>LIVE</b></div>
          </div>
        </article>
      </section>

      <section className="panel tasks-panel">
        <div className="panel-title"><div><span className="eyebrow">LIVE QUEUE</span><h3>Tasks</h3></div><span className="muted">{tasks.length} items</span></div>
        <div className="task-list">
          {tasks.map((item) => (
            <div className="task-row" key={item.id}>
              <div><strong>{item.title}</strong><span>{item.agent}</span></div>
              <div className="task-actions"><span className={`badge ${item.status === "In progress" ? "running" : ""}`}>{item.status}</span>{item.status === "Ready" && <button onClick={() => runTask(item.id)}>Run</button>}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
