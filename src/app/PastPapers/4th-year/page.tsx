import PastPaper from "@/app/_components/PastPaper"

export default function page() {
  const modules = ['orthopedics', 'reproductive', 'derma_rehab_genetics', 'neuroscience', 'ENT', 'eye']
  const years = {
    orthopedics: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled'],
    reproductive: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled'],
    derma_rehab_genetics: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled'],
    neuroscience: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled'],
    ENT: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled'],
    eye: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled']
  }

  return (
    <PastPaper modules={modules} years={years} annual="4th-year"/>
  )
}