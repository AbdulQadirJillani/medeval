import PastPaper from "@/app/(PastPapers)/PastPaper"

export default function page() {
  const modules = ['foundation', 'infectious', 'blood', 'respiratory', 'cardiovascular', 'gastrointestinal', 'renal', 'endocrinology']
  const years = {
    foundation: [2023, 2024, 'compiled'],
    infectious: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 'compiled'],
    blood: [2017, 2018, 2020, 2021, 2022, 2023, 2024, 'compiled'],
    respiratory: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 'compiled'],
    cardiovascular: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 'compiled'],
    gastrointestinal: [2017, 2019, 2020, 2021, 2022, 2023, 2024, 'compiled'],
    renal: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 'compiled'],
    endocrinology: [2017, 2019, 2020, 2021, 2022, 2023, 2024, 'compiled']
  }

  return (
    <PastPaper modules={modules} years={years} annual="3rd-year" />
  )
}