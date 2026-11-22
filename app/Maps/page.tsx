import Map from "./Map"
import HospitalMapSVG from "./HospitalMapSVG"
import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata(
  "Campus & Hospital Maps",
  "Interactive map of Dow University and Civil Hospital: pick a ward to see the route to it.",
  "/Maps",
)

export default function Page() {
  return (
    <Map>
      <HospitalMapSVG />
    </Map>
  )
}
