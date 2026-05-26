import type { MetadataRoute } from "next"
import { allRoutes, MODULE_ORDER } from "@/app/(PastPapers)/pastPapers"
import { subjects } from "@/app/(BookBank)/BookBank/subjects"
import { systems } from "@/app/(SystemReview)/SystemReview/systems"

const SITE = "https://med-eval.vercel.app"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE, lastModified, priority: 1 },
    { url: `${SITE}/BookBank`, lastModified },
    { url: `${SITE}/Maps`, lastModified },
    { url: `${SITE}/Performance`, lastModified },
    { url: `${SITE}/SystemReview`, lastModified },
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

  const systemRoutes: MetadataRoute.Sitemap = systems.map(s => ({
    url: `${SITE}/SystemReview/${s}`,
    lastModified,
  }))

  return [...staticRoutes, ...yearOverviewRoutes, ...quizRoutes, ...bookRoutes, ...systemRoutes]
}
