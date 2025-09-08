import PastPaper from "@/app/(PastPapers)/PastPaper"

export default function page() {
  const modules = ['foundation', 'blood', 'locomotor', 'respiratory', 'cardiovascular']
  const years = {
    foundation: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 'compiled'],
    blood: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 'compiled'],
    locomotor: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 'compiled'],
    respiratory: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 'compiled'],
    cardiovascular: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 'compiled']
  }

  return (
    <PastPaper modules={modules} years={years} annual="1st-year" />
  )
}