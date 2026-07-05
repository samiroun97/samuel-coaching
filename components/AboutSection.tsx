import Title from "./Title";

const pillars = [
  {
    icon: (
      <svg viewBox="100 40 50 65" className="w-12 h-12">
        <g>
          <path d="M115.79 100.8h20.85l.583-15.894 3.937-4.812 2.48-12.102-6.562 5.832-4.812-4.668-8.895-1.894 5.395 6.562 2.918 7.727 1.457 1.605-2.332 1.164.144 11.961-1.894-13.418-3.063-.289 4.082-2.625-9.039-13.855-6.27-2.477 1.602-.73 1.313-2.04-.438-2.187 3.793 3.5 6.559-1.605.73-3.938-13.562-6.125-9.77 14.438 12.98 18.664Z" fill="#c9a84c"/>
          <path d="m121.77 43.203-5.395 7.145 7.145 3.062 4.082-6.855Z" fill="#c9a84c"/>
          <path d="m128.48 46.992-4.23 6.563 4.957 2.77-.727 3.648 2.622-1.75 4.668-6.711Z" fill="#c9a84c"/>
          <path d="m135.332 53.266 6.414 4.37-9.039 11.083-5.832-2.77Z" fill="#c9a84c"/>
          <path d="m142.473 58.223 4.523 5.832-9.918 8.894-3.937-3.5Z" fill="#c9a84c"/>
          <path d="m127.309 62.012-2.477 4.23-4.082-2.332Z" fill="#c9a84c"/>
        </g>
      </svg>
    ),
    label: "15 ANS DE TERRAIN",
    text: "Je connais l'effort, mais surtout ce qui fonctionne.",
  },
  {
    icon: (
      <svg viewBox="100 31 48 58" className="w-12 h-12">
        <g>
          <path d="m144.406 77.082-7.594-13.14c.075-.196.149-.391.211-.583.239-.683.465-1.332.805-1.793.324-.457.867-.859 1.445-1.289.899-.691 1.926-1.46 2.309-2.636.375-1.137.027-2.29-.316-3.41-.211-.708-.41-1.387-.41-1.985 0-.601.199-1.273.41-1.988.343-1.117.691-2.274.316-3.406-.379-1.176-1.41-1.95-2.309-2.637-.578-.43-1.117-.836-1.445-1.29-.34-.464-.566-1.116-.805-1.8-.363-1.062-.785-2.273-1.773-2.988-.992-.711-2.2-.746-3.375-.77-.73-.015-1.422-.023-1.98-.21-.52-.16-1.063-.544-1.641-.958-.938-.652-1.992-1.398-3.258-1.398s-2.32.746-3.262 1.394c-.578.407-1.129.793-1.64.957-.559.188-1.246.196-1.977.211-1.176.024-2.394.059-3.375.77-.98.715-1.41 1.922-1.777 2.996-.235.68-.461 1.328-.805 1.793-.324.453-.867.86-1.441 1.289-.903.687-1.926 1.46-2.313 2.637-.375 1.132-.023 2.285.317 3.406.21.71.414 1.387.414 1.988 0 .598-.203 1.274-.414 1.985-.34 1.117-.692 2.273-.317 3.41.383 1.175 1.41 1.945 2.313 2.633.574.433 1.113.835 1.441 1.292.344.461.57 1.114.805 1.801.066.184.137.38.21.575l-7.593 13.144q-.25.45.043.879.3.42.809.332l6.668-1.25 2.261 6.394c.203.641 1.153.731 1.469.133l8.02-13.894q.146.012.293 0l8.023 13.894c.316.598 1.266.504 1.469-.132l2.254-6.399 6.66 1.25a.77.77 0 0 0 .812-.332q.288-.425.043-.875m-29.527.121-.477-1.351a.78.78 0 0 0-.359-.438.75.75 0 0 0-.555-.09l-1.43.258 4.926-8.512c1.168.114 2.5-.09 3.504.414Zm10.117-14.012q-1.08 0-2.137-.21a11 11 0 0 1-2.054-.622 11 11 0 0 1-1.895-1.011 10.9 10.9 0 0 1-3.02-3.023 10.5 10.5 0 0 1-1.011-1.895 10.92 10.92 0 0 1 0-8.379q.41-.997 1.012-1.895a10.87 10.87 0 0 1 4.914-4.031 10.9 10.9 0 0 1 6.328-.625 10.9 10.9 0 0 1 3.945 1.637 10.9 10.9 0 0 1 3.024 3.02q.596.897 1.011 1.894a11 11 0 0 1 .832 4.191q0 1.078-.21 2.133-.213 1.059-.626 2.055a11 11 0 0 1-1.015 1.89 10.9 10.9 0 0 1-3.02 3.02 10.87 10.87 0 0 1-6.078 1.851m11.5 12.13a.75.75 0 0 0-.555.09.75.75 0 0 0-.355.437l-.48 1.351-5.606-9.715c1.008-.507 2.332-.304 3.504-.414l4.918 8.508Z" fill="#c9a84c"/>
          <path d="M130.234 53.855a.38.38 0 0 0-.113.34l.293 2.434c.242 1.559-1.543 2.8-2.941 2.117l-2.274-1.031a.5.5 0 0 0-.406 0l-2.281 1.031c-1.395.691-3.18-.559-2.942-2.117l.293-2.441a.37.37 0 0 0-.113-.333l-1.703-1.808a2.01 2.01 0 0 1-.453-2.02q.174-.543.601-.922.427-.374.989-.484l2.457-.476a.46.46 0 0 0 .316-.22l1.227-2.14q.137-.24.332-.433c.129-.133.277-.243.433-.336a2.13 2.13 0 0 1 1.594-.207q.264.07.504.207.24.138.433.336.198.193.336.433l1.22 2.14a.46.46 0 0 0 .316.22l2.46.476c1.555.254 2.254 2.313 1.125 3.426Z" fill="#c9a84c"/>
        </g>
      </svg>
    ),
    label: "EXPERTISE CERTIFIÉE",
    text: "Instructeur certifié par Fit's pro en 2019. Ma méthode repose sur des bases concrètes.",
  },
  {
    icon: (
      <svg viewBox="112 39 28 38" className="w-12 h-12">
        <g>
          <path d="M131.492 41.55a.7.7 0 0 0-.34.2c-.011.02-.047.035-.054.059l-16.036 17.535a.4.4 0 0 0-.113.281c0 .223.172.398.399.398h8.156l-3.399 13.258v.086c-.003.024-.027.055-.027.082a.39.39 0 0 0 .395.399.41.41 0 0 0 .312-.141l16.176-18.445a.38.38 0 0 0 .113-.282.393.393 0 0 0-.398-.398h-8.754l3.91-12.434c.027-.054.027-.105.027-.171 0-.223-.011-.32-.195-.395a.34.34 0 0 0-.172-.031" fill="#c9a84c"/>
        </g>
      </svg>
    ),
    label: "SUR MESURE",
    text: "Un suivi qui te ressemble. Ton objectif reste le tien, je suis là pour t'y amener.",
  },
];

export default function AboutSection() {
  return (
    <section className="pt-40 pb-28 bg-[#0f0d07]">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <div className="relative">
          <div className="absolute -left-3 -top-3 w-24 h-24 border-l-2 border-t-2 border-[#c9a84c]/40" />
          <div className="relative aspect-[3/4] bg-cover bg-no-repeat overflow-hidden" style={{ backgroundImage: "url('/photos/samuel.jpg')", backgroundPosition: "40% center" }}>
            <div className="absolute inset-0 bg-[#0f0d07]/30" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent 30%, #0f0d07 100%)" }} />
          </div>
          <div className="absolute -right-3 -bottom-3 w-24 h-24 border-r-2 border-b-2 border-[#c9a84c]/40" />
        </div>

        <div>
          <p className="section-label mb-6">À Propos</p>
          <Title className="text-[clamp(2.5rem,5vw,4.5rem)] mb-8">
            JE SUIS SAMUEL
          </Title>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            Pratiquant de boxe et de musculation depuis mes 14 ans, j&apos;ai vécu de l&apos;intérieur ce que le sport peut changer, dans le corps comme dans la tête.
          </p>
          <p className="text-white/60 text-sm leading-relaxed mb-10">
            Avec plus de 15 ans d&apos;expertise, que tu cherches à te dépasser, retrouver la forme ou simplement te sentir mieux dans ton corps, je t&apos;accompagne à ton niveau, avec un suivi qui te ressemble. Pas de méthode miracle : de la rigueur, du sur-mesure, et un objectif qui reste le tien.
          </p>

          <div className="flex flex-col gap-14">
            {pillars.map((p, i) => (
              <div key={i} className="flex items-center gap-5 group">
                <div className="flex-shrink-0 text-[#c9a84c] opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                  {p.icon}
                </div>
                <div>
                  <p className="text-[0.6rem] tracking-[0.2em] text-[#c9a84c] uppercase mb-1">{p.label}</p>
                  <p className="text-white/55 text-sm leading-relaxed">{p.text}</p>
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontFamily: "var(--font-bebas)" }} className="mt-10 text-2xl tracking-[0.2em] text-white/10 uppercase select-none">
            Samuel Coaching
          </p>
        </div>
      </div>
    </section>
  );
}
