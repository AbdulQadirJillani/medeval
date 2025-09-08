import styles from './loading.module.css'

export default function Loading() {
  return (
    <>
    <div className={styles.loaderwrapper}>
        <div className={styles.loader}></div>
        <div className={`${styles.loadersection} ${styles.sectionleft}`}></div>
        <div className={`${styles.loadersection} ${styles.sectionright}`}></div>
    </div>
    </>
  )
}