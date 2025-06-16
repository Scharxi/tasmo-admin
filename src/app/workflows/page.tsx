import { Suspense } from 'react'
import { WorkflowBuilder } from '@/components/WorkflowBuilder'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Workflow Builder - Tasmota Hub',
  description: 'Erstellen und verwalten Sie automatisierte Geräte-Workflows',
}

function WorkflowBuilderWrapper() {
  return <WorkflowBuilder />
}

export default function WorkflowsPage() {
  return (
    <Suspense fallback={<div>Loading workflows...</div>}>
      <WorkflowBuilderWrapper />
    </Suspense>
  )
} 