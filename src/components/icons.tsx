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
  | 'arrow_forward'
  | 'add'
  | 'arrow_back'
  | 'check_circle'
  | 'chevron_right'
  | 'dns'
  | 'favorite_border'
  | 'group'
  | 'location_on'
  | 'lock'
  | 'logout'
  | 'mail'
  | 'monitor_heart'
  | 'more_vert'
  | 'notifications_active'
  | 'person'
  | 'privacy_tip'
  | 'route'
  | 'smart_toy'
  | 'warning'
  | 'visibility'
  | 'visibility_off'
  | 'close';

interface IconProps {
  name: IconName;
  color?: string;
  size?: number;
  style?: any;
}

export function Icon({ name, color = '#ffffff', size = 24, style }: IconProps) {
  switch (name) {
    case 'close':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
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
    case 'add':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'arrow_back':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M19 12H5M12 19l-7-7 7-7"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'check_circle':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
          <Path d="m9 12 2 2 4-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'chevron_right':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path d="m9 18 6-6-6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'dns':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Rect x="2" y="2" width="20" height="8" rx="2" ry="2" stroke={color} strokeWidth={2} />
          <Rect x="2" y="14" width="20" height="8" rx="2" ry="2" stroke={color} strokeWidth={2} />
          <Path d="M6 6h.01M6 18h.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'favorite_border':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'group':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'location_on':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={2} />
        </Svg>
      );
    case 'lock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'logout':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'mail':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'monitor_heart':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M8 21h8M12 17v4M2 10h4l2-5 3 10 3-7 2 2h4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'more_vert':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Circle cx="12" cy="12" r="1" fill={color} stroke={color} strokeWidth={2} />
          <Circle cx="12" cy="5" r="1" fill={color} stroke={color} strokeWidth={2} />
          <Circle cx="12" cy="19" r="1" fill={color} stroke={color} strokeWidth={2} />
        </Svg>
      );
    case 'notifications_active':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9m-9.73 13a3 3 0 0 0 5.46 0M10.27 2c.42-1.16 1.73-1.16 2.15 0M22 8h-2M2 8h2m15.5-5.5-1.42 1.42M5.92 3.92 4.5 2.5"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'person':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'privacy_tip':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'route':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Circle cx="6" cy="19" r="3" stroke={color} strokeWidth={2} />
          <Circle cx="18" cy="5" r="3" stroke={color} strokeWidth={2} />
          <Path d="M9 19h4.5a3.5 3.5 0 0 0 3.5-3.5v-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'smart_toy':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Rect x="3" y="8" width="18" height="12" rx="2" stroke={color} strokeWidth={2} />
          <Path d="M12 2v6M8 5h8M9 12h.01M15 12h.01M8 16h8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'warning':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path d="m10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'visibility':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'visibility_off':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M1 1l22 22" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    default:
      return null;
  }
}
