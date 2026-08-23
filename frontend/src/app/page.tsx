"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, Agent, Orchestration, Runtime, RuntimeMode, Task } from "../lib/api";

export default function HomePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [runtimes, setRuntimes] = useState<Runtime[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [task, setTask] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("Claude");
  const [selectedRuntime, setSelectedRuntime] = useState<RuntimeMode>("mock");
  const [message, setMessage] = useState("Connecting to backend...");
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [orchestration, setOrchestration] = useState<Orchestration | null>(null);
  const [orchestrating, setOrchestrating] = useState(false);

  useEffect(() => {
    Promise.all([api.getAgents(), api.getRuntimes(), api.getTasks()]).then(([loadedAgents, loadedRuntimes, loadedTasks]) => {
      setAgents(loadedAgents); setRuntimes(loadedRuntimes); setTasks(loadedTasks);
      if (loadedAgents.length) setSelectedAgent(loadedAgents[0].name);
      if (loadedRuntimes.some((item) => item.name === "local" && item.available)) setSelectedRuntime("local");
      setMessage("All systems operational");
    }).catch((error) => setMessage(error instanceof Error ? error.message : "Backend unavailable"));
  }, []);

  const counts = useMemo(() => ({ total: tasks.length, active: tasks.filter((i) => i.status === "In progress").length, ready: tasks.filter((i) => i.status === "Ready").length, completed: tasks.filter((i) => i.status === "Completed").length }), [tasks]);

  async function createTask(event: FormEvent) {
    event.preventDefault(); const title = task.trim(); if (!title) return setMessage("Enter a task before creating it.");
    try { const created = await api.createTask(title, selectedAgent, selectedRuntime); setTasks((current) => [created, ...current]); setTask(""); setMessage(`Task assigned to ${selectedAgent} via ${selectedRuntime}.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to create task"); }
  }

  async function runTask(id: number) {
    setSelectedTask(id);
    try { const updated = await api.executeTask(id); setTasks((current) => current.map((item) => item.id === id ? updated : item)); setMessage(`Task ${updated.status.toLowerCase()}.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to execute task"); }
    finally { setSelectedTask(null); }
  }

  async function buildAndRunPlan() {
    const title = task.trim(); if (!title) return setMessage("Describe the project you want the orchestrator to build.");
    setOrchestrating(true); setOrchestration(null);
    try {
      const plan = await api.createOrchestration(title, selectedRuntime); setOrchestration(plan); setTask(""); setMessage(`${plan.steps.length}-step plan created. Running dependencies in order...`);
      const result = await api.executeOrchestration(plan.id); setOrchestration(result);
      const refreshed = await api.getTasks(); setTasks(refreshed); setMessage(result.status === "Completed" ? "Orchestration completed successfully." : result.error ?? "Orchestration failed.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Orchestration failed"); }
    finally { setOrchestrating(false); }
  }

  return (
    <main className="shell">
      <header className="topbar"><div><div className="eyebrow">AI DEV PLATFORM</div><h1>Agent Workspace</h1></div><div className="status-pill"><span /> {message}</div></header>
      <section className="hero"><div><p className="eyebrow">ORCHESTRATOR V1</p><h2>Plan, route and execute software work.</h2><p className="muted">Run a single task or let the orchestrator decompose a project into dependent agent steps. Choose Local, API, or CI-safe Mock execution.</p></div><div className="stats"><div><strong>{counts.total}</strong><span>Total tasks</span></div><div><strong>{counts.active}</strong><span>Running</span></div><div><strong>{counts.ready}</strong><span>Ready</span></div><div><strong>{counts.completed}</strong><span>Completed</span></div></div></section>
      <section className="agents-grid">{agents.map((agent) => <article className="agent-card" key={agent.name}><div className="agent-head"><span className="agent-dot" /><span className="agent-status">AVAILABLE</span></div><h3>{agent.name}</h3><p>{agent.role}</p><div className="progress"><span /></div><small>Selectable per task</small></article>)}</section>
      <section className="workspace-grid"><article className="panel"><div className="panel-title"><div><span className="eyebrow">WORKSPACE</span><h3>Create work</h3></div></div><form onSubmit={createTask} className="task-form"><input value={task} onChange={(e) => setTask(e.target.value)} placeholder="Describe a task or project..." aria-label="Task description" /><select value={selectedRuntime} onChange={(e) => setSelectedRuntime(e.target.value as RuntimeMode)} aria-label="Execution runtime">{runtimes.map((runtime) => <option key={runtime.name} value={runtime.name} disabled={!runtime.available}>{runtime.name.toUpperCase()} — {runtime.description}</option>)}</select><select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)} aria-label="Assign agent">{agents.map((agent) => <option key={agent.name}>{agent.name}</option>)}</select><button type="submit">Create task</button><button type="button" disabled={orchestrating} onClick={buildAndRunPlan}>{orchestrating ? "Orchestrating…" : "Build & Run Plan"}</button></form></article><article className="panel"><div className="panel-title"><div><span className="eyebrow">RUNTIMES</span><h3>Execution modes</h3></div></div><div className="checks">{runtimes.map((runtime) => <div key={runtime.name}><span>{runtime.name.toUpperCase()}</span><b>{runtime.available ? "READY" : "UNAVAILABLE"}</b></div>)}</div></article></section>
      {orchestration && <section className="panel tasks-panel"><div className="panel-title"><div><span className="eyebrow">ORCHESTRATION PLAN</span><h3>{orchestration.title}</h3></div><span className={`badge ${orchestration.status === "In progress" ? "running" : ""}`}>{orchestration.status}</span></div><div className="task-list">{orchestration.steps.map((step) => <div className="task-row" key={step.key}><div><strong>{step.title}</strong><span>{step.agent} · {step.runtime.toUpperCase()} · depends on {step.dependsOn.length ? step.dependsOn.join(", ") : "nothing"}</span></div><span className="badge">{step.key}</span></div>)}</div></section>}
      <section className="panel tasks-panel"><div className="panel-title"><div><span className="eyebrow">LIVE QUEUE</span><h3>Tasks</h3></div><span className="muted">{tasks.length} items</span></div><div className="task-list">{tasks.map((item) => <div className="task-row" key={item.id}><div><strong>{item.title}</strong><span>{item.agent} · {item.runtime.toUpperCase()}</span>{item.output && <small>{item.output}</small>}</div><div className="task-actions"><span className={`badge ${item.status === "In progress" ? "running" : ""}`}>{item.status}</span>{item.status === "Ready" && <button disabled={selectedTask === item.id} onClick={() => runTask(item.id)}>{selectedTask === item.id ? "Running…" : "Run"}</button>}</div></div>)}</div></section>
    </main>
  );
}
