"use client";
// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

import Image from 'next/image';
import Link from 'next/link';
import styles from '@/app/LandingPage.module.css';
import { useLocale } from '@/app/lib/i18n';
import LanguageSwitch from '@/components/LanguageSwitch/LanguageSwitch';

export function FooterSection() {
  const { t } = useLocale();

  // Smooth scroll handler for internal navigation
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: string) => {
    e.preventDefault();
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Language switcher - floats over the hero, always accessible */}
      <div className={styles.langSwitchFloat}>
        <LanguageSwitch />
      </div>

      {/* Footer Section - Redesigned */}
      <footer className={styles.footer}>
        <div className={styles.footerMain}>
          {/* Left: Branding, description, social */}
          <div className={styles.footerLeft}>
            <div className={styles.footerBrand}>
              <Image src="/favicon.png" alt={t('landing.footer.logoAlt')} width={36} height={36} className={styles.footerLogo} />
              <div>
                <div className={styles.footerTitle}>{t('landing.footer.brand')} <span className={styles.footerBy}>{t('landing.footer.brandBy')}</span></div>
              </div>
            </div>
            <p className={styles.footerDesc}>
              {t('landing.footer.description')}
            </p>
            <div className={styles.footerSocials}>
              <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={styles.socialIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M7 2C4.23858 2 2 4.23858 2 7V17C2 19.7614 4.23858 22 7 22H17C19.7614 22 22 19.7614 22 17V7C22 4.23858 19.7614 2 17 2H7ZM12 7C14.7614 7 17 9.23858 17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7ZM19 7.5C19.2761 7.5 19.5 7.27614 19.5 7C19.5 6.72386 19.2761 6.5 19 6.5C18.7239 6.5 18.5 6.72386 18.5 7C18.5 7.27614 18.7239 7.5 19 7.5Z" fill="currentColor"/></svg>
              </a>
              <a href="https://x.com/" target="_blank" rel="noopener noreferrer" aria-label="X" className={styles.socialIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M17.53 2H21.5L14.36 10.39L22.74 21.5H16.08L10.98 14.93L5.19 21.5H1.21L8.78 12.61L0.75 2H7.58L12.18 7.97L17.53 2ZM16.36 19.5H18.19L6.5 4.5H4.54L16.36 19.5Z" fill="currentColor"/></svg>
              </a>
            </div>
          </div>

          {/* Center: Mini Roadmap */}
          <div className={styles.footerCenter}>
            <div className={styles.footerMiniRoadmapTitle}>{t('landing.footer.miniRoadmapTitle')}</div>
            <div className={styles.footerMiniRoadmap}>
              {[
                { i: 0, done: true },
                { i: 1, done: true },
                { i: 2, done: false },
                { i: 3, done: false },
              ].map(({ i, done }) => (
                <div
                  className={styles.roadmapItem + ' ' + (done ? styles.roadmapDone : styles.roadmapNext)}
                  key={i}
                >
                  <span className={styles.roadmapIcon}>{done ? '✔️' : '🔜'}</span>
                  <span>{t(`landing.footer.miniRoadmapItems.${i}`)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Navigation menu */}
          <div className={styles.footerRight}>
            <nav className={styles.footerNav} aria-label={t('landing.footer.navAria')}>
              <a href="#inicio" onClick={e => handleScroll(e, 'inicio')}>{t('landing.footer.navLinks.inicio')}</a>
              <a href="#informacion" onClick={e => handleScroll(e, 'informacion')}>{t('landing.footer.navLinks.informacion')}</a>
              <a href="#caracteristicas" onClick={e => handleScroll(e, 'caracteristicas')}>{t('landing.footer.navLinks.caracteristicas')}</a>
              <a href="#galeria" onClick={e => handleScroll(e, 'galeria')}>{t('landing.footer.navLinks.galeria')}</a>
              <a href="#estado" onClick={e => handleScroll(e, 'estado')}>{t('landing.footer.navLinks.estado')}</a>
              <a href="#roadmap" onClick={e => handleScroll(e, 'roadmap')}>{t('landing.footer.navLinks.roadmap')}</a>
              <a href="#inicio" onClick={e => handleScroll(e, 'inicio')}>{t('landing.footer.navLinks.app')}</a>
            </nav>
          </div>
        </div>
        {/* Bottom: Copyright and legal links */}
        <div className={styles.footerBottom}>
          <div className={styles.footerCopyright}>
            {t('landing.footer.copyright')}
          </div>
          <div className={styles.footerLegal}>
            <Link href="/changelog" className={styles.footerLegalLink}>{t('landing.footer.legal.changelog')}</Link>
            <Link href="/privacy" className={styles.footerLegalLink}>{t('landing.footer.legal.privacy')}</Link>
            <Link href="/terms" className={styles.footerLegalLink}>{t('landing.footer.legal.terms')}</Link>
            <Link href="/cookies" className={styles.footerLegalLink}>{t('landing.footer.legal.cookies')}</Link>
          </div>
        </div>
      </footer>
    </>
  );
}

export default FooterSection;
