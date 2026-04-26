'use client'

// =============================================================================
// components/tickets/ticket-comments.tsx
// Thread komentar dengan realtime update via Supabase WebSocket
// =============================================================================

import { useState, useTransition, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Send, Lock, Unlock, Trash2, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { addComment, deleteComment } from '@/lib/actions/comment-actions'
import { getInitials, formatRelativeTime } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { TicketComment, Profile } from '@/lib/types'

interface TicketCommentsProps {
  ticketId: string
  comments: TicketComment[]
  currentProfile: Profile
}

export function TicketComments({ ticketId, comments: initialComments, currentProfile }: TicketCommentsProps) {
  const [comments, setComments] = useState(initialComments)
  const [content, setContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  // Stable client instance — tidak dibuat ulang setiap render
  const supabase = useRef(createClient()).current

  const isAdmin = currentProfile.role === 'it_admin' || currentProfile.role === 'admin'

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Realtime subscription via WebSocket
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_comments',
          filter: `ticket_id=eq.${ticketId}`,
        },
        async (payload) => {
          const newRow = payload.new as TicketComment

          // Fetch author profile — tidak disertakan dalam payload realtime
          const { data: author } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newRow.author_id)
            .single()

          setComments((prev) => {
            if (prev.some((c) => c.id === newRow.id)) return prev
            return [...prev, { ...newRow, author: author ?? undefined }]
          })

          scrollToBottom()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'ticket_comments',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id
          if (deletedId) {
            setComments((prev) => prev.filter((c) => c.id !== deletedId))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [ticketId, supabase, scrollToBottom])

  function handleSubmit() {
    if (!content.trim()) return
    startTransition(async () => {
      const fd = new FormData()
      fd.append('ticket_id', ticketId)
      fd.append('content', content)
      fd.append('is_internal', String(isInternal))

      const result = await addComment(fd)
      if (result.success) {
        setContent('')
        setIsInternal(false)
      } else {
        toast.error(result.error ?? 'Gagal mengirim komentar')
      }
    })
  }

  function handleDelete(commentId: string) {
    startTransition(async () => {
      const result = await deleteComment(commentId, ticketId)
      if (result.success) {
        // Hapus langsung untuk pengirim; realtime sync untuk client lain
        setComments((prev) => prev.filter((c) => c.id !== commentId))
        toast.success('Komentar dihapus')
      } else {
        toast.error(result.error)
      }
    })
  }

  const visibleComments = isAdmin
    ? comments
    : comments.filter((c) => !c.is_internal)

  return (
    <div className="space-y-4">
      {/* Comment Thread */}
      {visibleComments.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground border rounded-xl bg-muted/20">
          Belum ada komentar. Jadilah yang pertama!
        </div>
      ) : (
        <div className="space-y-3">
          {visibleComments.map((comment) => {
            const author = comment.author as Profile | undefined
            const isOwner = comment.author_id === currentProfile.id
            return (
              <div
                key={comment.id}
                className={`group flex gap-3 ${
                  comment.is_internal
                    ? 'bg-amber-50/70 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-xl p-3'
                    : ''
                }`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(author?.full_name ?? 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold">{author?.full_name ?? 'Unknown'}</span>
                    {comment.is_internal && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 gap-1">
                        <Lock className="h-2.5 w-2.5" /> Internal Note
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.created_at)}</span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                </div>
                {(isOwner || isAdmin) && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input Area */}
      <div className="border rounded-xl p-4 space-y-3 bg-card">
        <Textarea
          id="comment-input"
          placeholder="Tulis komentar..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-20 resize-none border-0 focus-visible:ring-0 p-0 shadow-none"
          disabled={isPending}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit()
          }}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Switch
                  id="internal-toggle"
                  checked={isInternal}
                  onCheckedChange={setIsInternal}
                  disabled={isPending}
                />
                <Label htmlFor="internal-toggle" className="text-xs flex items-center gap-1 cursor-pointer">
                  {isInternal ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  {isInternal ? 'Internal Note' : 'Komentar Publik'}
                </Label>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Ctrl+Enter untuk kirim</span>
            <Button
              id="comment-submit"
              size="sm"
              onClick={handleSubmit}
              disabled={isPending || !content.trim()}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
