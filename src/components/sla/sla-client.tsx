'use client'

// =============================================================================
// components/sla/sla-client.tsx
// Manajemen SLA Policies untuk IT Admin
// =============================================================================

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Save, Loader2, Timer, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { updateSLAPolicy } from '@/lib/actions/sla-actions'
import { formatDuration } from '@/lib/utils'
import { TicketPriorityBadge } from '@/components/tickets/ticket-priority-badge'
import type { SLAPolicy, TicketPriority } from '@/lib/types'

interface SLAClientProps { policies: SLAPolicy[] }

export function SLAClient({ policies: initial }: SLAClientProps) {
  const [policies, setPolicies] = useState(
    initial.reduce((acc, p) => ({ ...acc, [p.id]: { response: p.response_time_minutes, resolution: p.resolution_time_minutes } }), {} as Record<string, { response: number; resolution: number }>)
  )
  const [isPending, startTransition] = useTransition()

  function handleSave(policy: SLAPolicy) {
    const current = policies[policy.id]
    startTransition(async () => {
      const result = await updateSLAPolicy(policy.id, current.response, current.resolution)
      if (result.success) toast.success(`SLA untuk ${policy.priority} berhasil diperbarui`)
      else toast.error(result.error)
    })
  }

  const PRIORITY_ORDER: TicketPriority[] = ['low', 'medium', 'high', 'critical']
  const sorted = [...initial].sort((a, b) => PRIORITY_ORDER.indexOf(a.priority as TicketPriority) - PRIORITY_ORDER.indexOf(b.priority as TicketPriority))

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">SLA Management</h2>
        <p className="text-muted-foreground text-sm mt-1">Atur target waktu respon dan resolusi untuk setiap level prioritas</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Waktu Respon</strong>: Waktu maksimal sejak tiket dibuat hingga IT Admin pertama kali merespons.<br />
          <strong>Waktu Resolusi</strong>: Waktu maksimal sejak tiket dibuat hingga diselesaikan.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {sorted.map((policy) => {
          const current = policies[policy.id] ?? { response: policy.response_time_minutes, resolution: policy.resolution_time_minutes }
          return (
            <Card key={policy.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Timer className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TicketPriorityBadge priority={policy.priority as TicketPriority} />
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Saat ini: respon {formatDuration(policy.response_time_minutes)} • resolusi {formatDuration(policy.resolution_time_minutes)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Waktu Respon (menit)</label>
                    <Input
                      id={`sla-response-${policy.priority}`}
                      type="number"
                      min={5}
                      value={current.response}
                      onChange={(e) => setPolicies(prev => ({ ...prev, [policy.id]: { ...prev[policy.id], response: Number(e.target.value) } }))}
                    />
                    <p className="text-xs text-muted-foreground">{formatDuration(current.response)}</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Waktu Resolusi (menit)</label>
                    <Input
                      id={`sla-resolution-${policy.priority}`}
                      type="number"
                      min={30}
                      value={current.resolution}
                      onChange={(e) => setPolicies(prev => ({ ...prev, [policy.id]: { ...prev[policy.id], resolution: Number(e.target.value) } }))}
                    />
                    <p className="text-xs text-muted-foreground">{formatDuration(current.resolution)}</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => handleSave(policy)} disabled={isPending} id={`sla-save-${policy.priority}`}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Simpan
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
