import PastPaper from "@/app/_components/PastPaper"

export default function page() {
  const modules = ['foundation', 'infectious', 'hematology', 'respiratory', 'cardiovascular', 'gastrointestinal', 'renal', 'endocrinology']
  const years = {
    foundation: [2023],
    infectious: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled'],
    hematology: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled'],
    respiratory: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled'],
    cardiovascular: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled'],
    gastrointestinal: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled'],
    renal: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled'],
    endocrinology: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled']
  }

  return (
    <PastPaper modules={modules} years={years} annual="3rd-year"/>
  )
}