import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export type IconName =
  | 'search'
  | 'mic'
  | 'rainy'
  | 'traffic'
  | 'map'
  | 'tune'
  | 'refresh'
  | 'my_location'
  | 'directions_car'
  | 'videocam'
  | 'notifications'
  | 'menu'
  | 'account_circle'
  | 'arrow_forward';

interface IconProps {
  name: IconName;
  color?: string;
  size?: number;
  style?: any;
}

export function Icon({ name, color = '#ffffff', size = 24, style }: IconProps) {
  switch (name) {
    case 'search':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={2} />
          <Path d="m21 21-4.3-4.3" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'mic':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Rect x="9" y="3" width="6" height="11" rx="3" stroke={color} strokeWidth={2} />
          <Path d="M5 10a7 7 0 0 0 14 0M12 17v4m-4 0h8" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'rainy':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M4 14.89A6 6 0 1 1 15.67 10.19a5.5 5.5 0 1 1 1.03 10.8H6.5A5.5 5.5 0 0 1 4 14.89Z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M8 18v3M12 18v3M16 18v3" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'traffic':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Rect x="7" y="2" width="10" height="20" rx="3" stroke={color} strokeWidth={2} />
          <Circle cx="12" cy="7" r="2" fill={color} />
          <Circle cx="12" cy="12" r="2" fill={color} />
          <Circle cx="12" cy="17" r="2" fill={color} />
        </Svg>
      );
    case 'map':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6zm6-3v15m6-12v15"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'tune':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M4 10h4M12 10h8M4 14h8M16 14h4M4 18h12M20 18h0M8 8v4M12 12v4M16 16v4"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'refresh':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M21 3v5h-5"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'my_location':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth={2} />
          <Circle cx="12" cy="12" r="2.5" fill={color} />
          <Path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'directions_car':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H6.2c-.6 0-1.2.3-1.6.7L2.4 10S-.3 10.6-2.1 11.1c-.8.2-1.5 1-1.5 1.9v3c0 .6.4 1 1 1h2m3 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0zm10 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'videocam':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path d="m22 8-6 4 6 4V8Z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Rect x="2" y="6" width="14" height="12" rx="2" stroke={color} strokeWidth={2} />
        </Svg>
      );
    case 'notifications':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9m4.3 13a3 3 0 0 0 5.4 0"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'menu':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path d="M4 12h16M4 6h16M4 18h16" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'account_circle':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
          <Path
            d="M12 14a4 4 0 0 0-4 4v1a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1a4 4 0 0 0-4-4Z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Circle cx="12" cy="8" r="2.5" stroke={color} strokeWidth={2} />
        </Svg>
      );
    case 'arrow_forward':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M5 12h14M12 5l7 7-7 7"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    default:
      return null;
  }
}
