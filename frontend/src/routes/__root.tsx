import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import * as React from 'react'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <React.Fragment>
      <nav className="p-4 border-b flex gap-4">
        <Link to="/" className="text-blue-500 hover:underline [&.active]:font-bold">Home</Link>
        <Link to="/counter" className="text-blue-500 hover:underline [&.active]:font-bold">Counter</Link>
      </nav>
      <div className="p-4">
        <hr className="my-4" />
        <Outlet />
      </div>
    </React.Fragment>
  )
}
