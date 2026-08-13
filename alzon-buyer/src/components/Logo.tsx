interface LogoProps {
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Logo({ height = 36, className, style }: LogoProps) {
  return (
    <img
      src="/allzon-logo.png"
      alt="ALLZON — Right Parts. Right Performance"
      className={className}
      style={{
        height: `${height}px`,
        width: 'auto',
        objectFit: 'contain',
        display: 'block',
        ...style,
      }}
    />
  );
}
