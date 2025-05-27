// components/ThreeColumnSection.jsx
import Link from 'next/link';
import styles from '../styles/ThreeColumnSection.module.css';

export default function ThreeColumnSection() {
  return (
    <div className={styles.container}>
      {/* Column 1 */}
      <div className={styles.column}>
        <h3 className={styles.title}>Kids' Classes</h3>
        <p className={styles.body}>
Our kids classes focus on developing discipline, respect, and physical fitness. All in a fun and safe environment. </p>
        <Link href="/classes" className={styles.button}>
          View Classes
        </Link>
      </div>
      {/* Column 2 */}
      <div className={styles.column}>
        <h3 className={styles.title}>Teen & Adult Classes</h3>
        <p className={styles.body}>
          Become part of a supportive community designed to improve fitness, develop self-defense skills and build confidence.
        </p>
        <Link href="/about" className={styles.button}>
          About Us
        </Link>
      </div>
      {/* Column 3 */}
      <div className={styles.column}>
        <h3 className={styles.title}>Family Classes</h3>
        <p className={styles.body}>
          Familes can train together in our family classes, promoting bonding and shared experiences through martial arts.While keeping each other motivated and accountable.
        </p>
        <Link href="/contact" className={styles.button}>
          Contact Us
        </Link>
      </div>
    </div>
  );
}