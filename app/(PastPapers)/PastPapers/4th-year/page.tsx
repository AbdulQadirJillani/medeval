import PastPaper from "@/app/(PastPapers)/PastPaper"

export default function page() {
  const modules = ['orthopedics', 'reproductive', 'drg', 'neuroscience', 'otorhinolaryngology', 'ophthalmology']
  const years = {
    orthopedics: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 'compiled'],
    reproductive: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 'compiled'],
    drg: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 'compiled'],
    neuroscience: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 'compiled'],
    otorhinolaryngology: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 'compiled'],
    ophthalmology: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 'compiled']
  }

  return (
    <PastPaper modules={modules} years={years} annual="4th-year" />
  )
}