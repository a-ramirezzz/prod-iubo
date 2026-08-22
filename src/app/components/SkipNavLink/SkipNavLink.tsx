"use client";

import { useLocale } from "@/app/lib/i18n";
import styles from "./SkipNavLink.module.css";

interface SkipNavLinkProps {
  targetId?: string;
}

export default function SkipNavLink({ targetId = "main-content" }: SkipNavLinkProps) {
  const { t } = useLocale();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(targetId);
    if (!target) return;

    event.preventDefault();
    target.focus();
    target.scrollIntoView();
  };

  return (
    <a href={`#${targetId}`} className={styles.skipLink} onClick={handleClick}>
      {t("accessibility.skipToContent")}
    </a>
  );
}
