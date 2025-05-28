// components/ThreeColumnSection.jsx
import Link from 'next/link';
import styles from '../styles/ThreeColumnSection.module.css';

export default function ThreeColumnSection() {
  return (
    <div className={styles.container}>
      {/* Column 1 */}
      <div className={styles.column}>
        <h3 className={styles.title}>Kids Classes</h3>
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
        <h3 className={styles.title}>Yotae</h3>
        <p className={styles.body}>
          Yotae blends Taekwondo and yoga into one powerful program for all ages and skill levels—whether you are a playful beginner, an energetic kid, or an advanced athlete looking to enhance strength, flexibility, and focus.
        </p>
        <Link href="/contact" className={styles.button}>
          Contact Us
        </Link>
      </div>
    </div>
  );
}