"use client";

import { useMemo, useState } from "react";
import type { ExecutionLog, Orchestration, Task } from "../lib/api";

type Tab = "overview" | "logs" | "output" | "plan";

type Props = { task: Task | null; logs: ExecutionLog[]; orchestration: Orchestration | null; onRun: () => void };

export function DevelopmentWorkspace({ task, logs, orchestration, onRun }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const failed = task?.status === "Failed";
  const completed = task?.status === "Completed";
  const checks = useMemo(() => [
    ["Agent routing", Boolean(task?.agent)],
    ["Runtime selected", Boolean(task?.runtime)],
    ["Execution logs", logs.length > 0],
    ["Output generated", Boolean(task?.output)],
    ["Verification", completed],
  ] as const, [task, logs.length, completed]);
  if (!task) return null;

  return (
    <section className="panel development-workspace" aria-label="Development workspace">
      <div className="panel-title"><div><span className="eyebrow">DEVELOPMENT WORKSPACE</span><h3>{task.title}</h3></div><div className="workspace-actions"><span className={`badge ${task.status === "In progress" ? "running" : ""}`}>{task.status}</span>{task.status !== "In progress" && <button onClick={onRun}>{completed ? "Run again" : "Run task"}</button>}</div></div>
      <nav className="workspace-tabs" aria-label="Workspace views">{(["overview", "logs", "output", "plan"] as Tab[]).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</nav>
      {tab === "overview" && <div className="workspace-overview"><div className="workspace-meta"><div><span>Agent</span><strong>{task.agent}</strong></div><div><span>Runtime</span><strong>{task.runtime.toUpperCase()}</strong></div><div><span>Log events</span><strong>{logs.length}</strong></div></div><div className="verification-grid">{checks.map(([label, ok]) => <div key={label} className={ok ? "check ok" : failed ? "check failed" : "check pending"}><span>{ok ? "✓" : failed ? "!" : "○"}</span><div><strong>{label}</strong><small>{ok ? "Passed" : failed ? "Needs attention" : "Waiting"}</small></div></div>)}</div></div>}
      {tab === "logs" && <div className="workspace-console">{logs.length ? logs.map((log, index) => <div className={`log ${log.level}`} key={`${log.timestamp}-${index}`}><time>{new Date(log.timestamp).toLocaleTimeString()}</time><span>{log.message}</span></div>) : <span className="muted">No execution logs yet.</span>}</div>}
      {tab === "output" && <pre className="workspace-code">{task.output ?? "No output has been generated yet."}</pre>}
      {tab === "plan" && <div className="workspace-plan">{orchestration?.steps.length ? orchestration.steps.map((step, index) => <div className="workspace-step" key={step.key}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{step.title}</strong><small>{step.agent} · {step.runtime.toUpperCase()} · {step.dependsOn.length ? `depends on ${step.dependsOn.join(", ")}` : "no dependencies"}</small></div></div>) : <span className="muted">Create an orchestration plan to see the dependency graph here.</span>}</div>}
    </section>
  );
}
