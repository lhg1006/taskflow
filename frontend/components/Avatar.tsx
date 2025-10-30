interface AvatarProps {
  name: string;
  avatar?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  xs: 'w-5 h-5 text-xs',
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-base',
};

const colors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-cyan-500',
];

export function Avatar({ name, avatar, size = 'md' }: AvatarProps) {
  const getColorFromName = (name: string) => {
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  const initial = name[0]?.toUpperCase() || '?';
  const colorClass = getColorFromName(name);

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover shrink-0 aspect-square`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${colorClass} rounded-full flex items-center justify-center text-white font-semibold shrink-0 aspect-square`}
      title={name}
    >
      {initial}
    </div>
  );
}
