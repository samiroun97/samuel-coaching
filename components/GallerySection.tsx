const items = [
  { label: "FORCE", img: "/photos/force.jpg" },
  { label: "EXCELLENCE", img: "/photos/excellence.jpg" },
  { label: "DISCIPLINE", img: "/photos/discipline.jpg" },
  { label: "PROGRESSION", img: "/photos/progression.jpg" },
];

export default function GallerySection() {
  return (
    <section className="grid grid-cols-2 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="relative aspect-square overflow-hidden group">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url('${item.img}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[#0a0a0a]/40 group-hover:bg-[#0a0a0a]/20 transition-colors duration-500" />
          <div className="absolute inset-0 flex items-end justify-start p-6">
            <span className="font-[family-name:var(--font-barlow)] font-black text-2xl tracking-[0.15em] uppercase text-white">
              {item.label}
            </span>
          </div>
        </div>
      ))}
    </section>
  );
}
