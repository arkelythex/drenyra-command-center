import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'
import { DemoFeatureUnavailable } from '../../components/demo-feature-unavailable'
import { isDemoFeatureEnabled } from '../../lib/demo-feature-flags'

const PayrollView = lazyRouteComponent(
  () => import('../../features/payroll/components/PayrollView'),
  'PayrollView',
)

export const Route = createFileRoute('/operaciones/payroll')({
  component: PayrollRoute,
})

function PayrollRoute() {
  if (!isDemoFeatureEnabled('payroll')) {
    return (
      <DemoFeatureUnavailable
        title="Nómina deshabilitada en demo"
        description="La demo ProInnóvate está recortada al flujo contable core. Nómina sigue fuera del alcance validado y se oculta para no degradar la presentación."
      />
    )
  }

  return <PayrollView />
}
