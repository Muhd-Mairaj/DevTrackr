import { HttpResponse, http } from "msw";

export const handlers = [
  http.get("*/api/ping", () => {
    return HttpResponse.json({ status: "ok", message: "pong" });
  }),
];
