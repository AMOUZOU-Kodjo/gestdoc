export default function UserAvatar({ user, size = 'sm' }) {
  const sizes = { xs: 'w-7 h-7 text-xs', sm: 'w-9 h-9 text-sm', md: 'w-11 h-11 text-base', lg: 'w-14 h-14 text-lg' }
  const sz = sizes[size] || sizes.sm

  return (
    <div className={`${sz} rounded-full overflow-hidden flex-shrink-0 bg-primary/10 flex items-center justify-center`}>
      {user?.avatarUrl
        ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
        : <span className="font-bold text-primary">{user?.prenom?.[0]}{user?.nom?.[0]}</span>
      }
    </div>
  )
}
