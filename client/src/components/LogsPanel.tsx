import React, { useEffect, useState } from "react";
import Console from "./Console";

export default function LogsPanel() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const buildId = "latest";
    const es = new EventSource(`/api/builds/${buildId}/logs`);

    es.onmessage = (e) => {
      setLogs(prev => [...prev, e.data]);
    };

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, []);

  return (
    <div>
      <h3>Live Logs</h3>
      <Console lines={logs} />
    </div>
  );
}