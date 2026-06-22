import { createFileRoute } from '@tanstack/react-router'
import { AutomationsView } from '../../features/automations/components/AutomationsView'

export const Route = createFileRoute('/configuracion/automations')({
  component: AutomationsView,
})
