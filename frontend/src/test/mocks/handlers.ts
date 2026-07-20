import { HttpResponse, http } from "msw";

export const handlers = [
  http.get("*/api/v1/ping", () => {
    return HttpResponse.json({ status: "ok", message: "pong" });
  }),
];
