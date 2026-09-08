import { useLocation } from 'react-router-dom';
import { usePageIcons } from '@/contexts/PageIconsContext';

export function PageIconBanner() {
  const { pathname } = useLocation();
  const { getIcon } = usePageIcons();
  const icon = getIcon(pathname);

  if (!icon) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pt-4">
      <span
        role="img"
        aria-label="Icono de la página"
        className="select-none text-5xl leading-none drop-shadow-sm"
      >
        {icon}
      </span>
    </div>
  );
}