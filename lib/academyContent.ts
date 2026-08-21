// Contenu de l'Académie — section éducative façon "parcours" pour aider un
// débutant à comprendre la méthode Samuel Coaching. Unité pilote : "Les 7 mythes",
// adaptée du livre "Du Chaos à la Méthode" de Samuel Waelti.

export type AcademyCard = {
  kind: "text" | "quote";
  title?: string;
  body: string;
};

export type AcademyQuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

export type AcademyLesson = {
  id: string;
  title: string;
  subtitle: string;
  cards: AcademyCard[];
  quiz: AcademyQuizQuestion[];
};

export type AcademyUnit = {
  id: string;
  title: string;
  description: string;
  lessons: AcademyLesson[];
};

export const ACADEMY_UNITS: AcademyUnit[] = [
  {
    id: "les-7-mythes",
    title: "Les 7 mythes",
    description: "Déconstruis les croyances qui freinent 90% des débutants avant de poser les vraies bases.",
    lessons: [
      {
        id: "mythe-1",
        title: "Mythe 1",
        subtitle: "Tu peux tout transformer en même temps",
        cards: [
          { kind: "text", body: "Perdre du gras, prendre du muscle, améliorer ses performances — tout, en même temps. Sauf que le corps ne fonctionne pas comme ça." },
          { kind: "text", body: "Il ne réagit pas à un désir, même si tu t'investis à fond. Il réagit uniquement à des signaux." },
          { kind: "text", body: "Quand tout est mélangé, les signaux deviennent flous. Un jour tu te restreins, le lendemain tu compenses. Résultat : des progrès instables, voire inexistants." },
          { kind: "quote", body: "Pas parce que tu fais mal. Parce que le message envoyé à ton corps n'est jamais clair." },
          { kind: "text", body: "La bonne approche : hiérarchiser. Un objectif à la fois, jusqu'à la cible atteinte. Ensuite seulement, tu réorientes la stratégie." },
        ],
        quiz: [
          {
            question: "Pourquoi vouloir tout transformer en même temps ne marche pas ?",
            options: ["Parce que c'est physiquement impossible de progresser sur plusieurs fronts", "Parce que ça envoie des signaux contradictoires à ton corps", "Parce qu'il faut plus de compléments alimentaires"],
            correctIndex: 1,
          },
          {
            question: "Quelle est la bonne approche selon Samuel ?",
            options: ["Se concentrer sur un objectif à la fois", "Changer d'objectif chaque semaine pour varier", "Viser large pour couvrir toutes les bases"],
            correctIndex: 0,
          },
        ],
      },
      {
        id: "mythe-2",
        title: "Mythe 2",
        subtitle: "Ton intuition est ta meilleure boussole",
        cards: [
          { kind: "text", body: "Fonctionner uniquement au ressenti, c'est piocher des infos un peu partout et ne retenir que celles qui confirment ce qu'on croit déjà." },
          { kind: "text", body: "Aujourd'hui, deux clics suffisent pour trouver une \"preuve\" de n'importe quoi — vraie ou fausse." },
          { kind: "quote", body: "Vérifie toujours tes sources. Laisse l'émotion de côté : l'info doit parler à ton esprit critique, pas à ton envie du moment." },
          { kind: "text", body: "Et parfois, ça implique d'admettre qu'on s'est trompé, ou que le chemin suivi n'était pas le bon." },
        ],
        quiz: [
          {
            question: "Quel est le piège du \"tout au ressenti\" ?",
            options: ["On finit par chercher des infos qui confirment ce qu'on croit déjà", "On s'entraîne trop peu", "On mange trop de protéines"],
            correctIndex: 0,
          },
          {
            question: "Face à une info trouvée en ligne, la bonne réaction est de...",
            options: ["La croire si elle confirme ce que tu ressens", "Vérifier la source et rester critique", "L'ignorer systématiquement"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "mythe-3",
        title: "Mythe 3",
        subtitle: "Le \"no pain, no gain\"",
        cards: [
          { kind: "text", body: "Plus l'effort est dur, plus la diète est stricte, meilleur serait le résultat ? Faux. La biologie se moque du courage." },
          { kind: "text", body: "Faire des efforts, c'est bien. Mais ce n'est pas ce qui te fait progresser. Ce qui te fait progresser, c'est l'adaptation." },
          { kind: "quote", body: "L'échec musculaire provoque le signal. La récupération construit le muscle. Maîtrise le dosage." },
          { kind: "text", body: "Si tu te préserves toujours : ton corps stagne. Si tu cherches le chaos à chaque séance : tu satures ton système nerveux et tu détruis au lieu de construire." },
        ],
        quiz: [
          {
            question: "Qu'est-ce qui fait vraiment progresser ton corps ?",
            options: ["La souffrance", "L'adaptation, via un stress dosé et une vraie récupération", "Le fait de transpirer un maximum"],
            correctIndex: 1,
          },
          {
            question: "Que se passe-t-il si tu cherches le chaos à chaque entraînement ?",
            options: ["Tu progresses deux fois plus vite", "Tu satures ton système nerveux et stagnes, voire régresses", "Rien, plus c'est dur, mieux c'est"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "mythe-4",
        title: "Mythe 4",
        subtitle: "Tout dépend de la volonté",
        cards: [
          { kind: "text", body: "On te vend l'idée que si tu échoues, c'est que tu n'es \"pas assez\" impliqué. C'est faux." },
          { kind: "text", body: "Le corps obéit à des lois biologiques — et ces lois ont toujours le dernier mot, peu importe ta motivation." },
          { kind: "text", body: "Le mental a son utilité : garder le cap, rester constant. Mais il ne fabrique pas de résultats à lui seul, et ne remplace pas des fondations solides." },
          { kind: "quote", body: "Le mental peut masquer la réalité un certain temps. Il ne t'évitera pas le mur ; il te fait simplement gagner du temps avant de t'y écraser." },
        ],
        quiz: [
          {
            question: "Si les résultats ne viennent pas malgré tous tes efforts, la cause la plus probable est...",
            options: ["Un manque de volonté", "Des fondations (nutrition, récupération, structure) mal posées", "Un manque de motivation"],
            correctIndex: 1,
          },
          {
            question: "Quel est le vrai rôle de la volonté ?",
            options: ["Fabriquer les résultats toute seule", "Garder le cap et rester constant", "Remplacer un bon programme"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "mythe-5",
        title: "Mythe 5",
        subtitle: "La méthode d'un autre marchera sur toi",
        cards: [
          { kind: "quote", body: "Deux personnes peuvent suivre exactement la même méthode et vivre des expériences totalement différentes." },
          { kind: "text", body: "Chaque corps part d'un point différent : histoire, fatigue, tolérance au stress, métabolisme. C'est la variabilité interindividuelle, documentée scientifiquement (étude HERITAGE, Pr. Bouchard)." },
          { kind: "text", body: "On copie ce qui est visible : les calories affichées, les séances partagées, le résultat physique. On ne voit pas le sommeil réel, le stress quotidien, la génétique, ni le chemin parcouru." },
          { kind: "quote", body: "L'imitation est toujours bancale. L'adaptation, elle, fonctionne à chaque fois." },
        ],
        quiz: [
          {
            question: "Pourquoi la méthode d'un autre ne donne pas forcément le même résultat sur toi ?",
            options: ["Parce que chaque corps part d'un point différent (variabilité interindividuelle)", "Parce que cette personne triche", "Parce qu'il faut copier plus précisément"],
            correctIndex: 0,
          },
          {
            question: "Qu'est-ce qu'on ne voit généralement PAS chez quelqu'un qu'on copie ?",
            options: ["Ses calories affichées", "Son sommeil réel, son stress, sa génétique", "Ses séances partagées"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "mythe-6",
        title: "Mythe 6",
        subtitle: "Plus de cardio = moins de graisse",
        cards: [
          { kind: "text", body: "Le cardio, c'est de la dépense, donc ça fait maigrir... sauf que cette équation oublie la réponse adaptative du corps." },
          { kind: "text", body: "Trop de cardio sans cadre envoie un signal de détresse : le corps ralentit son métabolisme de base pour se protéger. C'est la thermogenèse adaptative (Rosenbaum & Leibel, 2010)." },
          { kind: "quote", body: "Plus tu gagnes en muscle, plus ta dépense calorique au repos augmente — 24h/24." },
          { kind: "text", body: "Le cardio n'est pas à bannir, c'est un outil de santé précieux. Mais s'il devient le socle de ta stratégie en déficit, tu ajoutes du stress sur du stress." },
        ],
        quiz: [
          {
            question: "Pourquoi trop de cardio en déficit peut freiner la perte de gras ?",
            options: ["Le corps s'adapte et ralentit son métabolisme pour se protéger", "Le cardio brûle du muscle instantanément", "Le cardio augmente l'appétit uniquement"],
            correctIndex: 0,
          },
          {
            question: "Quel est l'outil n°1 pour augmenter ta dépense, même au repos ?",
            options: ["Le cardio à jeun", "La musculation (construire du muscle)", "Les compléments brûle-graisse"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "mythe-7",
        title: "Mythe 7",
        subtitle: "La génétique",
        cards: [
          { kind: "text", body: "\"Je suis condamné, c'est génétique.\" La dernière carte, le dernier biais qu'on dégaine face à l'échec." },
          { kind: "quote", body: "La génétique influence la façon dont le corps réagit à un stress, pas le fait qu'il puisse ou non s'adapter." },
          { kind: "text", body: "Face à un déficit calorique, le corps est biologiquement obligé de puiser dans ses réserves de gras (étude Kevin Hall, 2012). Les gènes fixent la vitesse de la réponse, pas le résultat final." },
          { kind: "quote", body: "La génétique dicte le point de départ. Tes actions décident de l'arrivée." },
        ],
        quiz: [
          {
            question: "Que détermine réellement la génétique ?",
            options: ["Si ton corps peut s'adapter ou non", "La façon dont il réagit à un stress (faim, vitesse, récupération)", "Ton poids définitif à vie"],
            correctIndex: 1,
          },
          {
            question: "Face à un déficit calorique bien mené, que dit la science (Kevin Hall, 2012) ?",
            options: ["Certains génotypes ne perdent jamais de gras", "Le corps est biologiquement obligé de puiser dans ses réserves", "Seul le cardio permet de puiser dans les réserves"],
            correctIndex: 1,
          },
        ],
      },
    ],
  },
];
