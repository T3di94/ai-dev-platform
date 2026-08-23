"use client";

import { useMemo, useState } from "react";

type FileEntry = { path: string; content: string };

const seedFiles: FileEntry[] = [
  { path: "README.md", content: "# AI Dev Platform\n\nDevelopment workspace preview.\n" },
  { path: "src/index.ts", content: "export function hello() {\n  return \"Hello from the workspace\";\n}\n" },
  { path: "tests/index.test.ts", content: "import { hello } from \"../src/index\";\n\ntest(\"hello\", () => {\n  expect(hello()).toContain(\"workspace\");\n});\n" },
];

export function CodeWorkspace() {
  const [files] = useState(seedFiles);
  const [selected, setSelected] = useState(files[0].path);
  const [content, setContent] = useState(files[0].content);
  const [message, setMessage] = useState("Workspace ready");
  const [running, setRunning] = useState(false);
  const active = useMemo(() => files.find((file) => file.path === selected), [files, selected]);

  function selectFile(path: string) {
    const file = files.find((item) => item.path === path);
    if (!file) return;
    setSelected(path);
    setContent(file.content);
    setMessage(`Opened ${path}`);
  }

  async function runCheck() {
    setRunning(true);
    setMessage("Running workspace checks…");
    await new Promise((resolve) => setTimeout(resolve, 500));
    setMessage("Workspace checks ready — connect backend runner for real execution.");
    setRunning(false);
  }

  return (
    <section className="panel code-workspace" aria-label="Code workspace">
      <div className="panel-title">
        <div><span className="eyebrow">CODE WORKSPACE</span><h3>Files, editor & verification</h3></div>
        <span className="badge">{message}</span>
      </div>
      <div className="code-layout">
        <nav className="file-tree" aria-label="Project files">
          {files.map((file) => <button className={selected === file.path ? "active" : ""} key={file.path} onClick={() => selectFile(file.path)}>{file.path}</button>)}
        </nav>
        <div className="editor-shell">
          <div className="editor-toolbar"><strong>{active?.path}</strong><button onClick={runCheck} disabled={running}>{running ? "Checking…" : "Run checks"}</button></div>
          <textarea value={content} onChange={(event) => setContent(event.target.value)} spellCheck={false} aria-label="Code editor" />
        </div>
      </div>
    </section>
  );
}
