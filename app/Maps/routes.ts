export interface Routes {
  [key: string]: string;
}

// Shared path definitions — many wards share the same corridor route.
const paths = {
  medicine: "M 1315.3984,1367.7323 H 968.94908 v -99.1761 H 908.25845 V 1088.7403 H 1140.7768 V 921.35522",
  medThirdMain: "M 1315.6667,1368.4143 H 968.36184 v -98.7815 H 150.3549 v -50.915",
  ent: "M 1315.6714,1367.8591 H 969.37408 v -97.7482 H 374.69622 v -12.4645",
  pedsLong: "M 1316.0575,1369.5367 H 969.85197 V 1269.3315 H 259.57165 v -195.7333 h 71.84633 V 866.69384 h -22.97533",
  surgical: "M 1315.2737,1368.9202 H 968.93813 v -99.9618 H 907.01676 V 795.35209 h -94.23421",
  sicu: "M 1317.0383,1370.5862 H 968.46632 V 1270.5195 H 906.96435 V 724.03956 h -93.84244",
  eye: "M 1315.7645,1368.4279 H 968.73323 v -99.7534 H 257.73716 v -196.185 h 74.60763 V 649.37605 H 197.37703 v -27.83266",
  orthoLong: "M 1315.3978,1368.938 H 968.88338 v -99.5865 H 685.78134 v 45.6691",
  neuro: "M 1315.9182,1368.6358 H 969.70947 v -100.404 h -710.2834 v -194.8761 h 72.58069 V 650.12821 h 272.03373 v 20.5859",
} as const;

export const routes: Routes = {
  "M-1": paths.medicine,
  "M-2": paths.medicine,
  "M-3": paths.medThirdMain,
  "M-4": paths.ent,
  "M-5": paths.pedsLong,
  "MICU": paths.surgical,

  "S-1": paths.medicine,
  "S-2": paths.medicine,
  "S-3": paths.surgical,
  "S-4": paths.surgical,
  "S-5": paths.surgical,
  "S-6": paths.surgical,
  "OT-Complex": paths.medicine,
  "SICU": paths.sicu,

  "Peds-1": "M 1315.6327,1368.4301 H 969.81154 v -100.3325 h -64.05985 v -178.212 H 1335.2012 V 847.26385 h 193.7513 v 9.08722",
  "Peds-2": paths.pedsLong,
  "Peds-3": paths.pedsLong,
  "Peds-Surgery": paths.pedsLong,
  "Peds-Emergency": "M 1315.3072,1368.373 H 968.76059 v -98.805 H 258.31331 v -195.9358 h 71.89351 v -313.62 h 29.05562",
  "Peds-Cardiology": paths.pedsLong,
  "Peds-ICU": paths.pedsLong,
  "Neonatal-ICU": paths.pedsLong,

  "Gyne-1": paths.surgical,
  "Gyne-2": paths.surgical,
  "Gyne-3": paths.surgical,
  "Gyne-OT": paths.surgical,
  "Gyne-ER": paths.surgical,

  "Eye-1": paths.eye,
  "Eye-2": paths.eye,
  "Trauma Center": paths.eye,

  "ENT-1": paths.ent,
  "ENT-2": paths.ent,

  "Ortho-1": "M 1315.8608,1368.6102 H 969.0751 V 1268.5628 H 668.32963 v -11.7335",
  "Ortho-2": paths.orthoLong,
  "Ortho-OT": paths.orthoLong,
  "Rehabiliation Center": paths.orthoLong,

  "Cardiology": paths.pedsLong,
  "Cardiac Surgery": "M 1315.8705,1367.5482 H 968.49077 v -98.84 H 258.77663 v -195.8918 h 72.3642 V 871.20308 h 28.15063",

  "Dermatology": paths.pedsLong,
  "Plastic Surgery": paths.surgical,

  "Psychiatry": paths.pedsLong,

  "Neurology": paths.neuro,
  "Neurosurgery": paths.eye,
  "Stroke": paths.neuro,
  "Imaging": paths.neuro,

  "Infectious Disease": paths.surgical,

  "Anesthesia": paths.sicu,

  "SIUT-Emergency": paths.surgical,

  "Civil-Emergency": "M 1316.3196,1369.3187 H 968.82343 v -99.4409 H 259.02354 V 1073.5607 H 332.9696 V 656.13705 h 356.74234",

  "OPDs": "M 1315.8487,1369.7986 H 968.96935 V 1269.7454 H 260.60989 v -197.589 h 71.4696 V 648.14661 h 77.34329 v -50.98256"
};
