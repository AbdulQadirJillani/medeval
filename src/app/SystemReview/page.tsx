import SystemReview from "../_components/SystemReview"

function page() {
  const systems = ['blood-and-lymphoreticular-system', 'immune-system', 'gastrointestinal-system', 'musculoskeletal-system', 'nervous-system-and-special-senses', 'endocrine-system', 'respiratory-system', 'cardiovascular-system', 'renal-and-urinary-system', 'male-reproductve-system', 'female-reproductive-system-and-breast', 'pregnancy-childbirth-and-puerperium', 'skin-and-subcutaneous-tissue', 'multisystem-processes-and-disorders', 'human-development', 'behavioral-sciences', 'social-sciences']

  return (
    <SystemReview systems={systems}/>
  )
}

export default page