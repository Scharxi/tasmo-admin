import { WorkflowBuilder } from '@/components/WorkflowBuilder'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Workflow Builder - Tasmota Hub',
  description: 'Erstellen und verwalten Sie automatisierte Geräte-Workflows',
}

export default function WorkflowsPage() {
  return <WorkflowBuilder />
} 