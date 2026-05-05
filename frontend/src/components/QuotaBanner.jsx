import { useQuery } from '@tanstack/react-query'
import { Crown, Upload, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usersApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function QuotaBanner() {
  const { user } = useAuth()

  const { data: quota } = useQuery({
    queryKey: ['myQuota'],
    queryFn: () => usersApi.quota().then(r => r.data),
    enabled: !!user,
    staleTime: 60 * 1000,
  })

  if (!user || !quota || quota.unlimited) return null

  const pct = quota.totalAllowed > 0 ? Math.min(100, (quota.used / quota.totalAllowed) * 100) : 100
  const isExhausted = quota.remaining === 0
  const isLow = quota.remaining === 1

  if (!isExhausted && !isLow) return null // N'afficher que quand c'est urgent

  return (
    <div className={`px-4 py-2 text-sm flex items-center justify-between gap-3 flex-wrap ${isExhausted ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}>
      <div className="flex items-center gap-2">
        {isExhausted ? <Lock size={15} /> : <Crown size={15} />}
        <span>
          {isExhausted
            ? 'Quota épuisé — vous ne pouvez plus télécharger.'
            : `Plus qu'1 téléchargement gratuit restant.`
          }
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/upload" className="btn btn-xs btn-ghost gap-1">
          <Upload size={12} /> Uploader pour gagner +2
        </Link>
        <Link to="/abonnement" className="btn btn-xs btn-primary gap-1">
          <Crown size={12} /> S'abonner
        </Link>
      </div>
    </div>
  )
}