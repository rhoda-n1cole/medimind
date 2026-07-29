const translations = {
  en: {
    appName: "MediMind",
    registerTitle: "Create your account",
    registerSubtitle: "Set up medication reminders and track your progress, even offline.",
    fullName: "Full name",
    email: "Email",
    phoneNumber: "Phone number",
    password: "Password",
    confirmPassword: "Confirm password",
    createAccount: "Create account",
    alreadyHaveAccount: "Already have an account?",
    logIn: "Log in",
    loginTitle: "Welcome back",
    loginSubtitle: "Log in to see today's medications and appointments.",
    newToMediMind: "New to MediMind?",
    createAnAccount: "Create an account",
    logOut: "Log out",
    yourMedications: "Your medications",
    addMedication: "Add a medication",
    medicationName: "Medication name",
    medicationNamePlaceholder: "e.g. Metformin",
    dosage: "Dosage",
    dosagePlaceholder: "e.g. 500mg",
    frequency: "Frequency",
    selectFrequency: "Select frequency",
    startDate: "Start date",
    endDateOptional: "End date (optional)",
    addMedicationButton: "Add medication",
    edit: "Edit",
    delete: "Delete",
    caregiverLinkCode: "Caregiver link code",
    generateCode: "Generate code",
    statusTaken: "Taken",
    statusMissed: "Missed",
    statusDue: "Due soon",
    noMedications: "No medications added yet.",
    passwordMismatch: "Passwords do not match.",
    saveChanges: "Save changes",
    cancelEdit: "Cancel",
    confirmDeleteMedication: "Delete this medication?",
    statusActive: "Active",
    statusUpcoming: "Upcoming",
    statusEnded: "Ended",
    linkCodeLabel: "Your caregiver code:",
    doseTimes: "Dose times",
    doseTimesPlaceholder: "e.g. 08:00, 20:00",
    reminderOffset: "Remind me before dose time",
    offsetOnTime: "On time",
    offsetFiveMin: "5 minutes before",
    offsetTenMin: "10 minutes before",
    offsetFifteenMin: "15 minutes before",
  },
  rw: {
    appName: "MediMind",
    registerTitle: "Fungura konti yawe",
    registerSubtitle: "Tegura kwibutswa gufata imiti no gukurikirana aho ugeze, n'igihe udafite interineti.",
    fullName: "Amazina yombi",
    email: "Imeyili",
    phoneNumber: "Nimero ya telefone",
    password: "Ijambo ry'ibanga",
    confirmPassword: "Emeza ijambo ry'ibanga",
    createAccount: "Fungura konti",
    alreadyHaveAccount: "Usanzwe ufite konti?",
    logIn: "Injira",
    loginTitle: "Murakaza neza",
    loginSubtitle: "Injira urebe imiti n'ibiganiro byo uyu munsi.",
    newToMediMind: "Uri gukoresha MediMind bwa mbere?",
    createAnAccount: "Fungura konti",
    logOut: "Sohoka",
    yourMedications: "Imiti yawe",
    addMedication: "Ongeraho umuti",
    medicationName: "Izina ry'umuti",
    medicationNamePlaceholder: "urugero: Metformin",
    dosage: "Ingano",
    dosagePlaceholder: "urugero: 500mg",
    frequency: "Inshuro",
    selectFrequency: "Hitamo inshuro",
    startDate: "Itariki yo gutangira",
    endDateOptional: "Itariki yo kurangiza (si ngombwa)",
    addMedicationButton: "Ongeraho umuti",
    edit: "Hindura",
    delete: "Siba",
    caregiverLinkCode: "Kode yo guhuza umurezi",
    generateCode: "Kora kode",
    statusTaken: "Yafashwe",
    statusMissed: "Yasibwe",
    statusDue: "Igiye gukurikira",
    noMedications: "Nta muti wongeweho.",
    passwordMismatch: "Amagambo y'ibanga ntabwo ahuye.",
    saveChanges: "Bika impinduka",
    cancelEdit: "Reka",
    confirmDeleteMedication: "Siba uyu muti?",
    statusActive: "Urakoresha",
    statusUpcoming: "Uzatangira",
    statusEnded: "Warangiye",
    linkCodeLabel: "Kode yawe y'umurezi:",
    doseTimes: "Amasaha yo gufata umuti",
    doseTimesPlaceholder: "urugero: 08:00, 20:00",
    reminderOffset: "Mbwira mbere y'igihe",
    offsetOnTime: "Igihe nyacyo",
    offsetFiveMin: "Iminota 5 mbere",
    offsetTenMin: "Iminota 10 mbere",
    offsetFifteenMin: "Iminota 15 mbere",
  },
};

function getLanguage() {
  return localStorage.getItem("medimind_lang") || "en";
}

function setLanguage(lang) {
  localStorage.setItem("medimind_lang", lang);
  applyTranslations();
}

function toggleLanguage() {
  setLanguage(getLanguage() === "en" ? "rw" : "en");
}

function translate(key) {
  const lang = getLanguage();
  return translations[lang][key] || translations.en[key] || key;
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = translate(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", translate(el.getAttribute("data-i18n-placeholder")));
  });
  const langButton = document.getElementById("langToggle");
  if (langButton) {
    langButton.textContent = getLanguage() === "en" ? "RW" : "EN";
  }
}

document.addEventListener("DOMContentLoaded", applyTranslations);