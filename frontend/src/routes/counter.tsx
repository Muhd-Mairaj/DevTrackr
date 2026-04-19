import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/counter')({
  component: CounterComponent,
})

function CounterComponent() {
  const [count, setCount] = useState(0)

  return (
    <div className="p-4 flex flex-col items-center gap-4">
      <h2 className="text-2xl font-bold">Counter Page</h2>
      <p className="text-xl">Current Count: {count}</p>
      <div className="flex gap-2">
        <Button onClick={() => setCount(count - 1)}>Decrement</Button>
        <Button onClick={() => setCount(count + 1)}>Increment</Button>
      </div>
    </div>
  )
}
