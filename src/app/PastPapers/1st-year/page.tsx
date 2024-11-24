import PastPaper from "@/app/_components/PastPaper"

export default function page() {
  const modules = ['foundation', 'hematology', 'locomotor', 'respiratory', 'cardiovascular']
  const years = {
    foundation: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled'],
    hematology: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled'],
    locomotor: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled'],
    respiratory: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled'],
    cardiovascular: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 'compiled']
  }

  return (
    <PastPaper modules={modules} years={years} annual="1st-year"/>
  )
}