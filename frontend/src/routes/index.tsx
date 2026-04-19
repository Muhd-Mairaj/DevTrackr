import { Button } from '@/components/ui/button'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  return (
    <>
      <p>DevTrackr meow meow</p>
      <Button size="lg">Zingy</Button>
    </>
  )
}
