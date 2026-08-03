import { useEffect, useState } from "react";
import { UtilsService } from "@/client";

type PingResponse = {
  status?: string;
  message?: string;
};

export function PingStatus() {
  const [data, setData] = useState<PingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    UtilsService.ping()
      .then((res: { data?: PingResponse }) => {
        if (res.data) {
          setData(res.data);
        }
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Error fetching ping status",
        );
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
