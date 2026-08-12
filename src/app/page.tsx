"use client";
// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

import dynamic from 'next/dynamic';
import styles from '@/app/LandingPage.module.css';
import { useLocale } from '@/app/lib/i18n';
import HeroSection from '@/app/components/landing/HeroSection';
import IntroSection from '@/app/components/landing/IntroSection';
import PomodoroSection from '@/app/components/landing/PomodoroSection';
import FeaturesSection from '@/app/components/landing/FeaturesSection';
import FooterSection from '@/app/components/landing/FooterSection';

const GallerySection = dynamic(() => import('@/app/components/landing/GallerySection'), { ssr: false });
const StatusSection = dynamic(() => import('@/app/components/landing/StatusSection'), { ssr: false });
const RoadmapSection = dynamic(() => import('@/app/components/landing/RoadmapSection'), { ssr: false });

export default function LandingPage() {
  const { t } = useLocale();

  return (
    <div className={styles.container}>
      {/* BETA Badge */}
      <div className={styles.betaBadge} title={t('landing.hero.badgeTooltip')}>
        {t('landing.hero.badge')}
      </div>

      <HeroSection />
      <IntroSection />
      <PomodoroSection />
      <FeaturesSection />
      <GallerySection />
      <StatusSection />
      <RoadmapSection />
      <FooterSection />
    </div>
  );
}
