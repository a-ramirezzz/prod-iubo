// app/components/ProjectBranding/ProjectBranding.tsx
import styles from './ProjectBranding.module.css'

/**
 * A simple presentational component that displays the project's brand name
 * It uses specific spans to allow for different styling on parts of the name
 */
export default function ProjectBranding() {
  return (
    <div className={styles.projectName}>
      {/* The first part of the brand name */}
      <span className={styles.projectNameProd}>Prod</span>
      {/* The second part of the brand name */}
      <span className={styles.projectNameUibo}>-UIBO</span>
    </div>
  )
}
