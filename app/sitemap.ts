import type { MetadataRoute } from "next"
import { allRoutes, MODULE_ORDER } from "@/app/(PastPapers)/pastPapers"
import { subjects } from "@/app/(BookBank)/BookBank/subjects"

const SITE = "https://med-eval.vercel.app"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE, lastModified, priority: 1 },
    { url: `${SITE}/BookBank`, lastModified },
    { url: `${SITE}/Maps`, lastModified },
    { url: `${SITE}/Performance`, lastModified },
  ]

  const yearOverviewRoutes: MetadataRoute.Sitemap = Object.keys(MODULE_ORDER).map(year => ({
    url: `${SITE}/PastPapers/${year}`,
    lastModified,
  }))

  const quizRoutes: MetadataRoute.Sitemap = allRoutes().map(({ QA }) => ({
    url: `${SITE}/PastPapers/${QA.join("/")}`,
    lastModified,
  }))

  const bookRoutes: MetadataRoute.Sitemap = subjects.map(s => ({
    url: `${SITE}/BookBank/${s}`,
    lastModified,
  }))

  // System Review is left out while its nav link is hidden; add /SystemReview
  // and its systems back here when it launches.
  return [...staticRoutes, ...yearOverviewRoutes, ...quizRoutes, ...bookRoutes]
}
