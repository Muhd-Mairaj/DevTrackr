import { useEffect, useState } from "react";
import { pingApiV1PingGet } from "@/client";

export function PingStatus() {
  const [data, setData] = useState<{
    status?: string;
    message?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pingApiV1PingGet()
      .then((res) => {
        if (res.data) {
          setData(res.data as { status?: string; message?: string });
        }
      })
      .catch((err) => {
        setError(err.message || "Error fetching ping status");
      });
  }, []);

  if (error) {
    return <div data-testid="ping-error">{error}</div>;
  }

  if (!data) {
    return <div data-testid="ping-loading">Loading ping...</div>;
  }

  return (
    <div data-testid="ping-container">
      <span data-testid="ping-status">{data.status}</span>
      <span data-testid="ping-message">{data.message}</span>
    </div>
  );
}
