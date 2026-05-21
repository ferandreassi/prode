import React from 'react';

interface TeamFlagProps {
  flag: string | null | undefined;
  className?: string;
  style?: React.CSSProperties;
}

export const TeamFlag: React.FC<TeamFlagProps> = ({ flag, className = '', style }) => {
  if (!flag) return null;

  const isUrl = flag.startsWith('http://') || flag.startsWith('https://');

  if (isUrl) {
    const imgStyle: React.CSSProperties = {
      width: '1.2em',
      height: '1.2em',
      objectFit: 'contain',
      borderRadius: '4px',
      verticalAlign: 'middle',
      display: 'inline-block',
      ...style,
    };
    return (
      <img
        src={flag}
        alt="Team flag"
        className={className}
        style={imgStyle}
      />
    );
  }

  return (
    <span className={className} style={style}>
      {flag}
    </span>
  );
};
