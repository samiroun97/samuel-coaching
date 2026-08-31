import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const METADATA_PATH = path.resolve("data/movekit/metadata/metadata.json");
const OUT_SQL = path.resolve("supabase/exercices_catalogue_movekit_migration.sql");
const BUCKET_BASE = process.env.SUPABASE_BUCKET_BASE;
if (!BUCKET_BASE) throw new Error("Set SUPABASE_BUCKET_BASE=https://<ref>.supabase.co/storage/v1/object/public/exercise-media");

const exercises = JSON.parse(readFileSync(METADATA_PATH, "utf8"));

// Termes propres (eponymes, marques, techniques nommées) : jamais traduits, gardés tels quels.
const KEEP_AS_IS = [
  "Arnold", "Bulgarian", "Cossack", "Turkish", "Nordic", "Smith", "Zercher", "Jefferson",
  "Yates", "Zottman", "Pendlay", "Meadows", "Tate", "Cuban", "JM", "Man Maker", "Wall Ball",
  "Dead Bug", "Dead Hang", "Man Makers", "EZ", "Man Maker", "Zottman",
];

// Substitutions de phrases (les plus longues d'abord), insensibles à la casse.
const PHRASE_MAP = [
  ["Bench Press", "développé couché"],
  ["Floor Press", "développé au sol"],
  ["Incline Bench Press", "développé incliné"],
  ["Decline Bench Press", "développé décliné"],
  ["Overhead Press", "développé militaire"],
  ["Push Press", "push press"],
  ["Push Jerk", "push jerk"],
  ["Split Jerk", "split jerk"],
  ["Hip Thrust", "hip thrust"],
  ["Glute Bridge", "pont fessier"],
  ["Split Squat", "fente bulgare"],
  ["Step Up", "step-up"],
  ["Step-Up", "step-up"],
  ["Pull Up", "traction"],
  ["Pull-Up", "traction"],
  ["Pull Ups", "tractions"],
  ["Chin Ups", "tractions en supination"],
  ["Push Up", "pompe"],
  ["Push-Up", "pompe"],
  ["Push Ups", "pompes"],
  ["Sit Up", "redressement assis"],
  ["Sit-Up", "redressement assis"],
  ["Situp", "redressement assis"],
  ["Knee Raise", "relevé de genoux"],
  ["Knee Raises", "relevés de genoux"],
  ["Leg Raise", "relevé de jambes"],
  ["Leg Curl", "leg curl"],
  ["Leg Press", "presse à cuisses"],
  ["Leg Extension", "extension des jambes"],
  ["Calf Raise", "mollets debout"],
  ["Calf Press", "mollets à la presse"],
  ["Lateral Raise", "élévation latérale"],
  ["Front Raise", "élévation frontale"],
  ["Rear Delt Fly", "oiseau"],
  ["Reverse Fly", "oiseau"],
  ["Chest Fly", "écarté couché"],
  ["Pec Fly", "écarté à la machine"],
  ["Pec Deck", "pec deck"],
  ["Face Pull", "face pull"],
  ["Wood Chopper", "rotation du tronc à la poulie"],
  ["Side Bend", "flexion latérale"],
  ["Wrist Curl", "flexion de poignet"],
  ["Wrist Extension", "extension de poignet"],
  ["Wrist Roller", "rouleau de poignet"],
  ["Tricep Extension", "extension triceps"],
  ["Tricep Kickback", "kickback triceps"],
  ["Tricep Pushdown", "extension triceps à la poulie"],
  ["Push Downs", "extension à la poulie"],
  ["Pushdown", "extension à la poulie"],
  ["Abdominals", "abdominaux"],
  ["Skullcrusher", "skullcrusher"],
  ["Hammer Curl", "curl marteau"],
  ["Preacher Curl", "curl pupitre"],
  ["Concentration Curl", "curl concentration"],
  ["Drag Curl", "curl traîné"],
  ["Spider Curl", "curl araignée"],
  ["Curl", "curl"],
  ["Shrug", "haussement d'épaules"],
  ["Shrugs", "haussements d'épaules"],
  ["Upright Row", "rowing menton"],
  ["Bent Over Row", "rowing buste penché"],
  ["Bent-Over Row", "rowing buste penché"],
  ["Seated Row", "rowing assis"],
  ["Row", "rowing"],
  ["Deadlift", "soulevé de terre"],
  ["Deadlifts", "soulevés de terre"],
  ["Rack Pull", "rack pull"],
  ["Good Mornings", "good mornings"],
  ["Back Extension", "extension du dos"],
  ["Hyperextension", "hyperextension"],
  ["Lat Pulldown", "tirage vertical"],
  ["Pulldown", "tirage vertical"],
  ["Pullover", "pull-over"],
  ["Lunge", "fente"],
  ["Lunges", "fentes"],
  ["Squat", "squat"],
  ["Squats", "squats"],
  ["Thruster", "thruster"],
  ["Snatch", "snatch"],
  ["Clean And Press", "clean and press"],
  ["Clean", "clean"],
  ["Farmers Carry", "farmer's walk"],
  ["Windmill", "moulinet"],
  ["Turkish Get-Up", "turkish get-up"],
  ["Swing", "swing"],
  ["Crunch", "crunch"],
  ["Russian Twist", "russian twist"],
  ["Mountain Climber", "mountain climber"],
  ["Jumping Jack", "jumping jack"],
  ["Jump Squats", "squats sautés"],
  ["Jump Rope", "corde à sauter"],
  ["Plank", "gainage"],
  ["Side Plank", "gainage latéral"],
  ["Dead Bug", "dead bug"],
  ["Dead Hang", "suspension"],
  ["Toes-to-Bar", "toes-to-bar"],
  ["V-Up", "v-up"],
  ["Superman", "superman"],
  ["Supermans", "supermans"],
  ["Dips", "dips"],
  ["Dip", "dips"],
  ["Kickback", "kickback"],
  ["Get-Up", "get-up"],
  ["Sled Push/Pull", "poussée/traction de traîneau"],
  ["Sled Pull", "traction de traîneau"],
  ["Sled Push", "poussée de traîneau"],
  ["Farmer", "farmer's walk"],
  ["Stretch", "étirement"],
  ["Stretching", "étirement"],
  ["Variation", "variante"],
  ["Cooldown", "retour au calme"],
  ["Warmup", "échauffement"],
  ["Intervals", "fractionné"],
  ["Sprint", "sprint"],
  ["Steady-State", "allure continue"],
  ["Steady State", "allure continue"],
  ["Repeats", "répétitions"],
  ["Run", "course"],
  ["Running", "course"],
  ["Walk", "marche"],
  ["Walking", "marche"],
  ["Swim", "natation"],
  ["Freestyle Swim", "natation crawl"],
  ["Backstroke Swim", "natation dos crawlé"],
  ["Breaststroke Swim", "natation brasse"],
  ["Butterfly Swim", "natation papillon"],
  ["Kick Drill", "battements de jambes"],
  ["Pull Drill", "exercice de traction (natation)"],
  ["Cycling", "vélo"],
  ["Indoor Cycling (Spin Bike)", "vélo en salle"],
  ["Hill Climb", "montée"],
  ["Stair Climber", "escalier (machine)"],
  ["Elliptical", "vélo elliptique"],
  ["Treadmill", "tapis de course"],
  ["Rowing Machine", "rameur"],
  ["Ski Erg", "skierg"],
  ["Arc Trainer", "arc trainer"],
  ["Assault Bike", "vélo d'assaut"],
  ["VersaClimber", "versaclimber"],
  ["Shadow Boxing", "shadow boxing"],
  ["Hiking", "randonnée"],
  ["Long Run", "course longue"],
  ["Tempo Run", "course tempo"],
  ["Trail Run", "trail"],
  ["Man Maker", "man maker"],
  ["Wall Ball", "wall ball"],
  ["Wall Sit", "chaise contre le mur"],
  ["Battle Ropes", "corde ondulatoire"],
  ["Pallof Press", "pallof press"],
  ["Z Press", "z press"],
  ["JM Press", "jm press"],
  ["Cuban Press", "cuban press"],
  ["Tate Press", "tate press"],
  ["Landmine Press", "landmine press"],
  ["Landmine", "landmine"],
  ["T Bar Row", "rowing t-bar"],
  ["T-Bar Row", "rowing t-bar"],
  ["Meadows Row", "meadows row"],
  ["Seal Row", "seal row"],
  ["Yates Row", "yates row"],
  ["Pendlay Row", "pendlay row"],
  ["Inverted Row", "rowing inversé"],
  ["Gorilla Row", "gorilla row"],
  ["Zottman Curl", "curl zottman"],
  ["Trap Bar", "barre hexagonale"],
  ["Hex Bar", "barre hexagonale"],
  ["EZ Bar", "barre EZ"],
  ["Barbell", "barre"],
  ["Dumbbell", "haltère"],
  ["Kettlebell", "kettlebell"],
  ["Cable", "poulie"],
  ["Machine", "machine"],
  ["Smith Machine", "machine Smith"],
  ["Band", "élastique"],
  ["Plate", "disque"],
  ["Bodyweight", "poids du corps"],
  ["Bicycle", "vélo"],
  ["Stability Ball", "swiss ball"],
  ["Captain's Chair", "chaise romaine"],
  ["Hammer Strength", "hammer strength"],
  ["Iso-Lateral", "iso-latéral"],
  ["Assisted", "assisté"],
  ["Alternating", "en alternance"],
  ["Single Arm", "unilatéral"],
  ["Single-Arm", "unilatéral"],
  ["Single Leg", "unilatéral"],
  ["Single-Leg", "unilatéral"],
  ["Single Legged", "unilatéral"],
  ["Bilateral", "bilatéral"],
  ["Unilateral", "unilatéral"],
  ["Close Grip", "prise serrée"],
  ["Close-Grip", "prise serrée"],
  ["Wide Grip", "prise large"],
  ["Wide-Grip", "prise large"],
  ["Neutral Grip", "prise neutre"],
  ["Neutral-Grip", "prise neutre"],
  ["Underhand Grip", "prise supination"],
  ["Underhand", "prise supination"],
  ["Overhand", "prise pronation"],
  ["Reverse Grip", "prise inversée"],
  ["Reverse-Grip", "prise inversée"],
  ["Snatch-Grip", "prise snatch"],
  ["Supinating", "en supination"],
  ["Seated", "assis"],
  ["Standing", "debout"],
  ["Kneeling", "à genoux"],
  ["Laying", "allongé"],
  ["Lying", "allongé"],
  ["Chest-Supported", "buste appuyé"],
  ["Chest Supported", "buste appuyé"],
  ["Feet Elevated", "pieds surélevés"],
  ["Heels Elevated", "talons surélevés"],
  ["Front-Foot-Elevated", "pied avant surélevé"],
  ["Deficit", "en déficit"],
  ["Elevated", "surélevé"],
  ["Incline", "incliné"],
  ["Decline", "décliné"],
  ["Flat", "plat"],
  ["Forward", "avant"],
  ["Reverse", "inversé"],
  ["Lateral", "latéral"],
  ["Rotational", "en rotation"],
  ["Rotation", "rotation"],
  ["Hip Abduction", "abduction de hanche"],
  ["Hip Adduction", "adduction de hanche"],
  ["Pause", "pause"],
  ["Tempo", "tempo"],
  ["Isometric Hold", "maintien isométrique"],
  ["Behind The Back", "derrière le dos"],
  ["Front Rack", "prise devant"],
  ["Overhead Squat", "squat overhead"],
  ["Front Squat", "squat avant"],
  ["Back Squat", "squat arrière"],
  ["Goblet Squat", "squat goblet"],
  ["Goblet", "goblet"],
  ["Sumo", "sumo"],
  ["Pistol", "pistol"],
  ["Sissy Squat", "sissy squat"],
  ["Cossack Squat", "squat cosaque"],
  ["Pendulum Squat", "squat pendulaire"],
  ["Knee Drive", "montée de genou"],
  ["Spinal Jefferson Curl", "jefferson curl"],
  ["Romanian Deadlift", "soulevé de terre roumain"],
  ["Stiff Leg Deadlifts", "soulevés de terre jambes tendues"],
  ["Snatch-Grip Deadlift", "soulevé de terre prise snatch"],
  ["Snatch-Grip High Pull", "tirage haut prise snatch"],
  ["Snatch Pull", "tirage snatch"],
  ["Hang Clean", "hang clean"],
  ["Hang Power Clean", "hang power clean"],
  ["Hang Snatch", "hang snatch"],
  ["Power Clean", "power clean"],
  ["Muscle Snatch", "muscle snatch"],
  ["Kickstand", "position kickstand"],
  ["Figure Four", "figure four"],
  ["B-Stance", "b-stance"],
  ["B-stance", "b-stance"],
  ["Narrow", "serré"],
  ["Rope", "corde"],
  ["Bar", "barre"],
];

const MUSCLE_MAP = {
  Adductors: "adducteurs", Back: "dos", Biceps: "biceps", Calves: "mollets",
  Chest: "pectoraux", Core: "abdominaux", Forearms: "avant-bras", Glutes: "fessiers",
  Hamstrings: "ischio-jambiers", "Lower Back": "bas du dos", Neck: "cou",
  Quadriceps: "quadriceps", Shoulders: "épaules", Tibialis: "tibial antérieur",
  Trapezius: "trapèzes", Triceps: "triceps",
};

// Doit correspondre aux clés attendues par ExerciceLibraryBrowser.tsx (CIBLE_TO_LIB) quand possible.
// "Back" chez MoveKit couvre les rowings/tirages/tractions → grand dorsal (les dorsaux), pas
// le "haut du dos" (zone trapèzes/rhomboïdes déjà couverte par la catégorie "trapèzes" à part).
// "Lower Back" couvre les extensions lombaires → lombaires (érecteurs du rachis), qui n'ont
// rien à voir avec le grand dorsal malgré une inversion historique de ces deux libellés
// (voir supabase/exercices_catalogue_dos_categories_fix.sql).
const MUSCLE_CIBLE_MAP = {
  Adductors: "adducteurs", Back: "grand dorsal", Biceps: "biceps", Calves: "mollets",
  Chest: "pectoraux", Core: "abdominaux", Forearms: "avant-bras", Glutes: "fessiers",
  Hamstrings: "ischio-jambiers", "Lower Back": "lombaires", Neck: "cou",
  Quadriceps: "quadriceps", Shoulders: "deltoïdes", Tibialis: "tibial antérieur",
  Trapezius: "trapèzes", Triceps: "triceps",
};

const PARTIE_CORPS_MAP = {
  Adductors: "cuisses", Back: "dos", Biceps: "bras", Calves: "bas des jambes",
  Chest: "pectoraux", Core: "abdominaux", Forearms: "avant-bras", Glutes: "cuisses",
  Hamstrings: "cuisses", "Lower Back": "dos", Neck: "cou",
  Quadriceps: "cuisses", Shoulders: "épaules", Tibialis: "bas des jambes",
  Trapezius: "dos", Triceps: "bras",
};

const EQUIPEMENT_MAP = {
  Band: "élastique", Barbell: "barre", "Battle Ropes": "corde ondulatoire", Bench: "banc",
  Bicycle: "vélo", Bodyweight: "poids du corps", "Cable Machine": "poulie", Dumbbell: "haltère",
  Kettlebell: "kettlebell", Machine: "machine à levier", Sled: "traîneau",
  "Stability Ball": "swiss ball", "Weight Plate": "disque", "Wrist Roller": "rouleau de poignet",
};

const sortedPhrases = [...PHRASE_MAP].sort((a, b) => b[0].length - a[0].length);

// Équipement en tête de nom (calque anglais) -> repoussé en fin de nom avec préposition FR.
const LEADING_EQUIPMENT = [
  [/^barre\s+/i, "barre", "à la"],
  [/^haltère\s+/i, "haltère", "à l'"],
  [/^poulie\s+/i, "poulie", "à la"],
  [/^élastique\s+/i, "élastique", "à l'"],
  [/^kettlebell\s+/i, "kettlebell", "au"],
  [/^machine\s+/i, "machine", "à la"],
  [/^banc\s+/i, "banc", "au"],
  [/^disque\s+/i, "disque", "au"],
  [/^swiss ball\s+/i, "swiss ball", "au"],
  [/^traîneau\s+/i, "traîneau", "au"],
  [/^corde ondulatoire\s+/i, "corde ondulatoire", "à la"],
  [/^rouleau de poignet\s+/i, "rouleau de poignet", "au"],
];

function translateName(name) {
  let out = name;
  for (const [en, fr] of sortedPhrases) {
    const re = new RegExp(`\\b${en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    out = out.replace(re, fr);
  }
  out = out.replace(/\s+/g, " ").trim().toLowerCase();

  for (const [re, equip, prep] of LEADING_EQUIPMENT) {
    if (re.test(out)) {
      const rest = out.replace(re, "").trim();
      if (rest) out = `${rest} ${prep} ${equip}`;
      break;
    }
  }
  return out.replace(/\s+/g, " ").trim();
}

function sqlStr(v) {
  if (v === null || v === undefined) return "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
}
function sqlArr(arr) {
  if (!arr || arr.length === 0) return "'{}'";
  return `ARRAY[${arr.map(sqlStr).join(",")}]::text[]`;
}

const rows = exercises.map((e) => {
  const isCardio = e.movementPattern.includes("Cardio");
  const primary = e.primaryMuscles[0];
  const partieCorps = isCardio ? "cardio" : (PARTIE_CORPS_MAP[primary] || "cuisses");
  const muscleCible = isCardio ? "système cardiovasculaire" : (MUSCLE_CIBLE_MAP[primary] || primary.toLowerCase());
  const musclesSecondaires = e.secondaryMuscles.map((m) => MUSCLE_MAP[m] || m.toLowerCase());
  const equipement = e.equipment.map((eq) => EQUIPEMENT_MAP[eq] || eq.toLowerCase()).join(" + ");

  return {
    id: `mk_${e.slug}`,
    nom: translateName(e.name),
    partie_corps: partieCorps,
    equipement,
    muscle_cible: muscleCible,
    muscles_secondaires: musclesSecondaires,
    image_url: `${BUCKET_BASE}/posters/${e.slug}.webp`,
    video_url: `${BUCKET_BASE}/videos/${e.slug}.mp4`,
  };
});

const sql = `-- ══════════════════════════════════════════════════════════════
-- Migration : remplacement du catalogue par les exercices MoveKit (licence commerciale
-- achetée, Complete Pack 412 exercices — voir data/movekit/metadata/LICENSE.txt, non
-- commité, gitignored). Noms traduits automatiquement (dictionnaire de termes fitness
-- généré par script) à partir des noms anglais MoveKit — à réviser au besoin.
-- Vidéos + posters hébergés sur Supabase Storage (bucket public "exercise-media"),
-- jamais copiés dans ce repo (repo public, licence "non redistribuable").
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.exercices_catalogue ADD COLUMN IF NOT EXISTS video_url text;

TRUNCATE public.exercices_catalogue;

INSERT INTO public.exercices_catalogue
  (id, nom, partie_corps, equipement, muscle_cible, muscles_secondaires, image_url, video_url)
VALUES
${rows.map((r) => `  (${sqlStr(r.id)}, ${sqlStr(r.nom)}, ${sqlStr(r.partie_corps)}, ${sqlStr(r.equipement)}, ${sqlStr(r.muscle_cible)}, ${sqlArr(r.muscles_secondaires)}, ${sqlStr(r.image_url)}, ${sqlStr(r.video_url)})`).join(",\n")};
`;

writeFileSync(OUT_SQL, sql);
console.log(`${rows.length} lignes écrites dans ${OUT_SQL}`);
