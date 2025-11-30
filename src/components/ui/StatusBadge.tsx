import { cn } from '@/lib/utils';

type StatusType = 
  | 'draft' 
  | 'pending' 
  | 'in_progress' 
  | 'completed' 
  | 'sent_for_quote' 
  | 'quoted'
  | 'submitted'
  | 'accepted'
  | 'rejected';

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  draft: { label: 'Rascunho', className: 'status-draft' },
  pending: { label: 'Pendente', className: 'status-pending' },
  in_progress: { label: 'Em andamento', className: 'status-in-progress' },
  completed: { label: 'Concluído', className: 'status-completed' },
  sent_for_quote: { label: 'Enviado p/ cotação', className: 'status-pending' },
  quoted: { label: 'Cotado', className: 'status-quoted' },
  submitted: { label: 'Enviado', className: 'status-completed' },
  accepted: { label: 'Aceito', className: 'status-completed' },
  rejected: { label: 'Rejeitado', className: 'bg-destructive/20 text-destructive' },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;
  
  return (
    <span className={cn('status-badge', config.className, className)}>
      {config.label}
    </span>
  );
}
