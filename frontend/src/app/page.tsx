"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, Agent, Runtime, RuntimeMode, Task } from "../lib/api";

export default function HomePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [runtimes, setRuntimes] = useState<Runtime[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [task, setTask] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("Claude");
  const [selectedRuntime, setSelectedRuntime] = useState<RuntimeMode>("local");
  const [message, setMessage] = useState("Connecting to backend...");
  const [selectedTask, setSelectedTask] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([api.getAgents(), api.getRuntimes(), api.getTasks()]).then(([loadedAgents, loadedRuntimes, loadedTasks]) => {
      setAgents(loadedAgents);
      setRuntimes(loadedRuntimes);
      setTasks(loadedTasks);
      if (loadedAgents.length > 0) setSelectedAgent(loadedAgents[0].name);
      if (loadedRuntimes.some((item) => item.name === "local" && item.available)) setSelectedRuntime("local");
      setMessage("All systems operational");
    }).catch((error) => setMessage(error instanceof Error ? error.message : "Backend unavailable"));
  }, []);

  const counts = useMemo(() => ({
    total: tasks.length,
    active: tasks.filter((item) => item.status === "In progress").length,
    ready: tasks.filter((item) => item.status === "Ready").length,
    completed: tasks.filter((item) => item.status === "Completed").length,
  }), [tasks]);

  async function createTask(event: FormEvent) {
    event.preventDefault();
    const title = task.trim();
    if (!title) return setMessage("Enter a task before creating it.");
    try {
      const created = await api.createTask(title, selectedAgent, selectedRuntime);
      setTasks((current) => [created, ...current]);
      setTask("");
      setMessage(`Task assigned to ${selectedAgent} via ${selectedRuntime}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to create task"); }
  }

  async function runTask(id: number) {
    setSelectedTask(id);
    try {
      const updated = await api.executeTask(id);
      setTasks((current) => current.map((item) => item.id === id ? updated : item));
      setMessage(`Task completed by ${updated.agent} via ${updated.runtime}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to execute task"); }
    finally { setSelectedTask(null); }
  }

  return (
    <main className="shell">
      <header className="topbar"><div><div className="eyebrow">AI DEV PLATFORM</div><h1>Agent Workspace</h1></div><div className="status-pill"><span /> {message}</div></header>
      <section className="hero"><div><p className="eyebrow">DUAL RUNTIME ORCHESTRATION</p><h2>Run AI locally or through cloud APIs.</h2><p className="muted">Choose the runtime and specialized agent for every task. Local execution uses Ollama and requires no cloud API key.</p></div><div className="stats"><div><strong>{counts.total}</strong><span>Total tasks</span></div><div><strong>{counts.active}</strong><span>Running</span></div><div><strong>{counts.ready}</strong><span>Ready</span></div><div><strong>{counts.completed}</strong><span>Completed</span></div></div></section>
      <section className="agents-grid">{agents.map((agent) => <article className="agent-card" key={agent.name}><div className="agent-head"><span className="agent-dot" /><span className="agent-status">AVAILABLE</span></div><h3>{agent.name}</h3><p>{agent.role}</p><div className="progress"><span /></div><small>Selectable per task</small></article>)}</section>
      <section className="workspace-grid"><article className="panel"><div className="panel-title"><div><span className="eyebrow">TASK QUEUE</span><h3>Create work</h3></div></div><form onSubmit={createTask} className="task-form"><input value={task} onChange={(e) => setTask(e.target.value)} placeholder="Describe a task..." aria-label="Task description" /><select value={selectedRuntime} onChange={(e) => setSelectedRuntime(e.target.value as RuntimeMode)} aria-label="Execution runtime">{runtimes.map((runtime) => <option key={runtime.name} value={runtime.name} disabled={!runtime.available}>{runtime.name.toUpperCase()} — {runtime.description}</option>)}</select><select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)} aria-label="Assign agent">{agents.map((agent) => <option key={agent.name}>{agent.name}</option>)}</select><button type="submit">Create task</button></form></article><article className="panel"><div className="panel-title"><div><span className="eyebrow">RUNTIMES</span><h3>Execution modes</h3></div></div><div className="checks">{runtimes.map((runtime) => <div key={runtime.name}><span>{runtime.name.toUpperCase()}</span><b>{runtime.available ? "READY" : "UNAVAILABLE"}</b></div>)}</div></article></section>
      <section className="panel tasks-panel"><div className="panel-title"><div><span className="eyebrow">LIVE QUEUE</span><h3>Tasks</h3></div><span className="muted">{tasks.length} items</span></div><div className="task-list">{tasks.map((item) => <div className="task-row" key={item.id}><div><strong>{item.title}</strong><span>{item.agent} · {item.runtime.toUpperCase()}</span>{item.output && <small>{item.output}</small>}</div><div className="task-actions"><span className={`badge ${item.status === "In progress" ? "running" : ""}`}>{item.status}</span>{item.status === "Ready" && <button disabled={selectedTask === item.id} onClick={() => runTask(item.id)}>{selectedTask === item.id ? "Running…" : "Run"}</button>}</div></div>)}</div></section>
    </main>
  );
}
