import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const locales = ["en", "pt", "es"];

const heroHeadlines = {
  en: "Skin comfort, Moroccan roots.",
  pt: "Conforto da pele, raízes marroquinas.",
  es: "Comodidad de la piel, raíces marroquíes."
};

const heroSubheadlines = {
  en: "Thank you for trusting skin that heals. This is Kapunka 2.0.",
  pt: "Obrigado por confiar na pele que cura. Este é o Kapunka 2.0.",
  es: "Gracias por confiar en la piel que sana. Este es Kapunka 2.0."
};

const heroCtaLabels = {
  en: {
    primary: "Shop argan rituals",
    secondary: "Clinics partnership"
  },
  pt: {
    primary: "Comprar rituais de argan",
    secondary: "Parceria com clínicas"
  },
  es: {
    primary: "Comprar rituales de argán",
    secondary: "Alianza para clínicas"
  }
};

const heroAlignmentDefaults = {
  heroAlignX: "center",
  heroAlignY: "middle",
  heroLayoutHint: "image-full",
  heroOverlay: 48
};

async function migrateHomePage(locale) {
  const filePath = resolve("content", "pages", locale, "home.json");
  const fileContents = await readFile(filePath, "utf8");
  const data = JSON.parse(fileContents);

  let hasChanges = false;

  if (data.heroHeadline == null) {
    data.heroHeadline = heroHeadlines[locale];
    hasChanges = true;
  }

  if (data.heroSubheadline == null) {
    data.heroSubheadline = heroSubheadlines[locale];
    hasChanges = true;
  }

  const heroAlignment = (data.heroAlignment && typeof data.heroAlignment === "object" && !Array.isArray(data.heroAlignment))
    ? data.heroAlignment
    : {};

  if (data.heroAlignment !== heroAlignment) {
    data.heroAlignment = heroAlignment;
    hasChanges = true;
  }

  for (const [key, value] of Object.entries(heroAlignmentDefaults)) {
    if (heroAlignment[key] == null) {
      heroAlignment[key] = value;
      hasChanges = true;
    }
  }

  const heroCtas = (data.heroCtas && typeof data.heroCtas === "object" && !Array.isArray(data.heroCtas)) ? data.heroCtas : {};

  if (data.heroCtas !== heroCtas) {
    data.heroCtas = heroCtas;
    hasChanges = true;
  }

  if (heroCtas.ctaPrimaryLabel == null) {
    heroCtas.ctaPrimaryLabel = heroCtaLabels[locale].primary;
    hasChanges = true;
  }

  if (heroCtas.ctaPrimaryHref == null) {
    heroCtas.ctaPrimaryHref = "/shop";
    hasChanges = true;
  }

  if (heroCtas.ctaSecondaryLabel == null) {
    heroCtas.ctaSecondaryLabel = heroCtaLabels[locale].secondary;
    hasChanges = true;
  }

  if (heroCtas.ctaSecondaryHref == null) {
    heroCtas.ctaSecondaryHref = "/for-clinics";
    hasChanges = true;
  }

  if (!Array.isArray(data.sections)) {
    data.sections = [];
    hasChanges = true;
  }

  const formatted = JSON.stringify(data, null, 2) + "\n";

  if (!hasChanges && fileContents === formatted) {
    return;
  }

  await writeFile(filePath, formatted, "utf8");
}

async function run() {
  for (const locale of locales) {
    await migrateHomePage(locale);
  }
}

run().catch((error) => {
  console.error("Failed to migrate home pages:", error);
  process.exitCode = 1;
});
