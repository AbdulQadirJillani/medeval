// No fs/path imports here: the client navbar imports this file.
// Per-year module ordering (curriculum order, not alphabetical).
// Add a module here once its folder exists in Database/PastPapers/<year>/.
// Names must match the folder exactly — 3rd/4th-year repeats carry a "-2"
// suffix, and 3rd-year blood is foldered as "hematology".
export const MODULE_ORDER: Record<string, string[]> = {
  "1st-year": ["foundation", "blood", "locomotor", "respiratory", "cardiovascular"],
  "2nd-year": ["neuroscience", "head-and-neck", "endocrinology", "gastrointestinal", "renal", "reproductive"],
  "3rd-year": ["foundation-2", "infectious", "hematology", "respiratory-2", "cardiovascular-2", "gastrointestinal-2", "renal-2", "endocrinology-2"],
  "4th-year": ["orthopedics", "reproductive-2", "drg", "neuroscience-2", "otorhinolaryngology", "ophthalmology"],
  "5th-year": ["medicine-1", "medicine-2", "surgery-1", "surgery-2", "obstetrics", "gynecology", "pediatrics"],
}

// Years in order, e.g. "1st-year". Shared by the navbar and the hero.
export const YEARS = Object.keys(MODULE_ORDER)
