import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { strings } from "@/lib/strings";

export const Route = createFileRoute("/counter")({
  component: CounterComponent,
});

function CounterComponent() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4 flex flex-col items-center gap-4">
      <h2 className="text-2xl font-bold">{strings.counter.title}</h2>
      <p className="text-xl">{strings.counter.currentCount(count)}</p>
      <div className="flex gap-2">
        <Button onClick={() => setCount(count - 1)}>
          {strings.counter.decrement}
        </Button>
        <Button onClick={() => setCount(count + 1)}>
          {strings.counter.increment}
        </Button>
      </div>
    </div>
  );
}
