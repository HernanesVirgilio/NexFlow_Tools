interface Props {
  /** CSS width, e.g. "100%", "8rem". */
  w?: string;
  /** CSS height. */
  h?: string;
  /** Extra classes. */
  className?: string;
  /** Round pill shape. */
  pill?: boolean;
}

/** Content placeholder. Respects prefers-reduced-motion (shimmer disabled in CSS). */
export function Skeleton({ w = '100%', h = '1rem', className = '', pill }: Props) {
  return (
    <span
      className={`nf-skeleton${pill ? ' nf-skeleton--pill' : ''} ${className}`}
      style={{ width: w, height: h }}
      aria-hidden="true"
    />
  );
}
