import React, { useEffect, useRef, useState, type ComponentType } from 'react';
import {
  Play,
  Monitor,
  SlidersHorizontal,
  Grid3x3,
  Lock,
  Zap,
  TrendingDown,
  AlertTriangle,
  Wrench,
  Snowflake,
  Building,
  Building2,
} from 'lucide-react';

const VIDEO_BASE = 'https://iotfiysolutions.com/assets/video/products/ac-kit/';
const VIDEO_CACHE = '?v=h246';
const IMG_BASE = '/landing/img/';

type PlaylistItem = {
  src: string;
  title: string;
  desc: string;
  meta: string;
  Icon: ComponentType<{ className?: string; size?: number | string }>;
};

const PLAYLIST: PlaylistItem[] = [
  {
    src: 'promo.mp4',
    title: 'Full Product Overview',
    desc: 'Complete walkthrough of IoTFIY AC-Kit — hardware, dashboard, and deployment at scale.',
    meta: '03:00 · Promo',
    Icon: Play,
  },
  {
    src: 'dashboard.mp4',
    title: 'Centralized Dashboard',
    desc: 'Access and control all AC units across branches, buildings, and floors from one cloud interface.',
    meta: 'Dashboard',
    Icon: Monitor,
  },
  {
    src: 'manage-unit.mp4',
    title: 'Manage AC Unit',
    desc: 'Control individual AC units — temperature, schedule, lock status, and on/off remotely.',
    meta: 'Control',
    Icon: SlidersHorizontal,
  },
  {
    src: 'multi-ac.mp4',
    title: 'Managing Multiple ACs',
    desc: 'Scale from one room to hundreds — bulk control, organization hierarchy, and venue management.',
    meta: 'Scale',
    Icon: Grid3x3,
  },
  {
    src: 'remote-lock.mp4',
    title: 'Remote Temperature Lock',
    desc: 'Set temperature ranges and lock controls so users cannot drop below safe, efficient levels.',
    meta: 'Policy',
    Icon: Lock,
  },
  {
    src: 'energy-monitoring.mp4',
    title: 'Energy Monitoring',
    desc: 'Real-time energy consumption per AC unit with the hybrid hardware variant.',
    meta: 'Energy',
    Icon: Zap,
  },
  {
    src: 'reduce-bill.mp4',
    title: 'Reduce Your Bill',
    desc: 'How organizations cut energy waste and recover AC-Kit cost through measurable savings.',
    meta: 'ROI',
    Icon: TrendingDown,
  },
  {
    src: 'fault-detection.mp4',
    title: 'Fault Detection',
    desc: 'Automatic alerts for offline, underperforming, or malfunctioning AC units.',
    meta: 'Alerts',
    Icon: AlertTriangle,
  },
  {
    src: 'maintenance.mp4',
    title: 'Maintenance Alerts',
    desc: 'Identify units under maintenance or needing service before they fail completely.',
    meta: 'Service',
    Icon: Wrench,
  },
  {
    src: 'installation.mp4',
    title: 'Installation Process',
    desc: 'Professional installation of the IoT module on existing AC units — IP65 casing included.',
    meta: 'Install',
    Icon: Wrench,
  },
  {
    src: 'device-on-ac.mp4',
    title: 'Device on AC Unit',
    desc: 'See the compact hardware module mounted on a live air conditioning unit.',
    meta: 'Hardware',
    Icon: Snowflake,
  },
  {
    src: 'venues.mp4',
    title: 'Classrooms & Offices',
    desc: 'Deploy across classrooms, offices, and retail stores with per-venue scheduling.',
    meta: 'Venues',
    Icon: Building,
  },
  {
    src: 'commercial-scale.mp4',
    title: 'Commercial Scale',
    desc: 'Manage large numbers of outdoor AC units across commercial buildings and campuses.',
    meta: 'Enterprise',
    Icon: Building2,
  },
];

function videoSrc(file: string) {
  return `${VIDEO_BASE}${file}${file === 'promo.mp4' ? VIDEO_CACHE : ''}`;
}

export function VideoHub() {
  const [activeIdx, setActiveIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const active = PLAYLIST[activeIdx];

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    el.load();
    el.play().catch(() => {});
  }, [activeIdx]);

  return (
    <section className="ack-videohub" id="video-hub">
      <div className="container">
        <div className="ack-videohub__head">
          <span className="ack-videohub__tag">// Video Control Room</span>
          <h2>13 product videos. One control hub.</h2>
          <p>
            Installation, dashboard walkthroughs, energy monitoring, remote lock, fault detection,
            and real-world deployments — click any clip to play.
          </p>
        </div>

        <div className="ack-videohub__layout">
          <div className="ack-videohub__main">
            <video
              ref={videoRef}
              key={active.src}
              controls
              playsInline
              preload="metadata"
              poster={`${IMG_BASE}overview.png`}
              aria-label="AC-Kit featured video"
            >
              <source src={videoSrc(active.src)} type="video/mp4" />
            </video>
            <div className="ack-videohub__now">
              <h3>{active.title}</h3>
              <p>{active.desc}</p>
            </div>
          </div>

          <div className="ack-videohub__playlist" role="list">
            {PLAYLIST.map((item, idx) => {
              const Icon = item.Icon;
              return (
                <button
                  key={item.src}
                  type="button"
                  className={`ack-vid-item${idx === activeIdx ? ' active' : ''}`}
                  onClick={() => setActiveIdx(idx)}
                >
                  <div className="ack-vid-item__thumb">
                    <Icon className="ack-ico" />
                  </div>
                  <div className="ack-vid-item__meta">
                    <h4>{item.title}</h4>
                    <span>{item.meta}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
