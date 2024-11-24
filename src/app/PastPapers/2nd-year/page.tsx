import PastPaper from "@/app/_components/PastPaper"

export default function page() {
  const modules = ['neuroscience', 'head_neck', 'endocrinology', 'gastrointestinal', 'renal', 'reproductive']
  const years = {
    neuroscience: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled'],
    head_neck: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled'],
    endocrinology: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled'],
    gastrointestinal: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled'],
    renal: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled'],
    reproductive: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled']
  }

  return (
    <PastPaper modules={modules} years={years} annual="2nd-year"/>
  )
}