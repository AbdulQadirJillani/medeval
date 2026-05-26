import styles from './RouteLoader.module.css'

function RouteLoader() {
  return (
    <div className={styles.loaderwrapper}>
      <div className={styles.loader}></div>
      <div className={`${styles.loadersection} ${styles.sectionleft}`}></div>
      <div className={`${styles.loadersection} ${styles.sectionright}`}></div>
    </div>
  )
}

export default RouteLoader
