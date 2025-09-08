import PastPaper from "@/app/(PastPapers)/PastPaper"

export default function page() {
  const modules = ['neuroscience', 'head-and-neck', 'endocrinology', 'gastrointestinal', 'renal', 'reproductive']
  const years = {
    neuroscience: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 'compiled'],
    'head-and-neck': [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 'compiled'],
    endocrinology: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 'compiled'],
    gastrointestinal: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 'compiled'],
    renal: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 'compiled'],
    reproductive: [2016, 2017, 2019, 2020, 2021, 2022, 2023, 2024, 'compiled']
  }

  return (
    <PastPaper modules={modules} years={years} annual="2nd-year" />
  )
}