import { useRef, useState } from "react";
import { Download, FileUp, Trash2 } from "lucide-react";

import { useAnchorStore } from "../useAnchorStore";
import { Button } from "../../components/ui/button";

export function SettingsRoute() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { exportWorkspace, importWorkspace, clearWorkspace } = useAnchorStore();

  async function downloadBackup() {
    const backupJson = await exportWorkspace();
    const blob = new Blob([backupJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `anchor-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Backup exported.");
  }

  async function importBackupFile(file: File) {
    const text = await file.text();
    const parsedBackup = JSON.parse(text);
    await importWorkspace(parsedBackup);
    setMessage("Backup imported.");
  }

  async function clearData() {
    const confirmed = window.confirm("Clear all Anchor data stored in this browser?");
    if (!confirmed) {
      return;
    }

    await clearWorkspace();
    setMessage("Local data cleared.");
  }

  return (
    <div className="space-y-6">
      <header className="px-1 pt-2">
        <p className="text-sm font-medium text-anchor-muted">Settings</p>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight text-anchor-text">Backups</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-anchor-muted">
          Anchor stores your workspace in this browser with IndexedDB. Use JSON backups when moving or resetting devices.
        </p>
      </header>

      {message ? (
        <div className="rounded-2xl border border-anchor-accent/30 bg-white/75 px-4 py-3 text-sm text-anchor-accent backdrop-blur">
          {message}
        </div>
      ) : null}

      <section className="grid gap-3 md:grid-cols-3">
        <ActionPanel
          title="Export backup"
          description="Download all spaces and items as a JSON file."
          action={
            <Button onClick={() => void downloadBackup()}>
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
          }
        />
        <ActionPanel
          title="Import backup"
          description="Restore a previously exported Anchor JSON file."
          action={
            <>
              <input
                ref={fileInputRef}
                className="hidden"
                type="file"
                accept="application/json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void importBackupFile(file);
                  }
                }}
              />
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                <FileUp className="h-4 w-4" />
                Import JSON
              </Button>
            </>
          }
        />
        <ActionPanel
          title="Clear local data"
          description="Remove all Anchor spaces and items from this browser."
          action={
            <Button variant="danger" onClick={() => void clearData()}>
              <Trash2 className="h-4 w-4" />
              Clear data
            </Button>
          }
        />
      </section>
    </div>
  );
}

function ActionPanel({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <section className="glass rounded-[28px] p-5">
      <h2 className="text-lg font-semibold text-anchor-text">{title}</h2>
      <p className="mt-2 min-h-12 text-sm leading-6 text-anchor-muted">{description}</p>
      <div className="mt-5">{action}</div>
    </section>
  );
}
