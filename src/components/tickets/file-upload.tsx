'use client'

// =============================================================================
// components/tickets/file-upload.tsx
// Komponen upload file untuk tiket — drag & drop atau click to upload
// =============================================================================

import { useState, useRef, useTransition } from 'react'
import { Paperclip, X, Upload, Loader2, FileText, Image, File } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { uploadTicketAttachment, deleteTicketAttachment } from '@/lib/actions/upload-actions'
import { formatFileSize } from '@/lib/utils'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/constants'
import type { TicketAttachment } from '@/lib/types'

interface FileUploadProps {
  ticketId: string
  existingAttachments?: TicketAttachment[]
  canDelete?: boolean
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File
  if (mimeType.startsWith('image/')) return Image
  if (mimeType === 'application/pdf') return FileText
  return File
}

export function TicketFileUpload({ ticketId, existingAttachments = [], canDelete = false }: FileUploadProps) {
  const [attachments, setAttachments] = useState<TicketAttachment[]>(existingAttachments)
  const [isPending, startTransition] = useTransition()
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return

    // Validasi di sisi klien sebelum kirim ke server
    const invalid = Array.from(files).filter(f => {
      if (!ALLOWED_FILE_TYPES.includes(f.type)) return true
      if (f.size > MAX_FILE_SIZE_BYTES) return true
      return false
    })
    if (invalid.length > 0) {
      toast.error(`File tidak valid: ${invalid.map(f => f.name).join(', ')}`)
      return
    }

    const fd = new FormData()
    Array.from(files).forEach(f => fd.append('files', f))

    startTransition(async () => {
      const result = await uploadTicketAttachment(ticketId, fd)
      if (result.success && result.data) {
        setAttachments(prev => [...prev, ...result.data!])
        toast.success(`${result.data.length} file berhasil diupload`)
        if (result.error) toast.warning(result.error)  // partial errors
      } else {
        toast.error(result.error ?? 'Upload gagal')
      }
    })
  }

  function handleDelete(attachmentId: string) {
    startTransition(async () => {
      const result = await deleteTicketAttachment(attachmentId)
      if (result.success) {
        setAttachments(prev => prev.filter(a => a.id !== attachmentId))
        toast.success('File dihapus')
      } else {
        toast.error(result.error ?? 'Gagal menghapus')
      }
    })
  }

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
        } ${isPending ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_FILE_TYPES.join(',')}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {isPending ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Mengupload...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-8 w-8" />
            <p className="text-sm font-medium">Drag & drop file ke sini atau klik untuk pilih</p>
            <p className="text-xs">JPG, PNG, PDF, DOC, XLSX — maks 5MB per file, maks 5 file</p>
          </div>
        )}
      </div>

      {/* File List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((att) => {
            const Icon = getFileIcon(att.mime_type)
            return (
              <div
                key={att.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 group"
              >
                <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <a
                    href={att.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline truncate block text-primary"
                  >
                    <Paperclip className="h-3 w-3 inline mr-1" />
                    {att.file_name}
                  </a>
                  <p className="text-xs text-muted-foreground">{formatFileSize(att.file_size)}</p>
                </div>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); handleDelete(att.id) }}
                    disabled={isPending}
                    title="Hapus file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
