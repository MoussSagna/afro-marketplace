/**
 * Le décor discret du hero, en SVG (aucune image à télécharger) :
 * - à gauche, des losanges emboîtés, repris du losange du logo (écrans ≥ 1600 px : en dessous,
 *   ils passeraient sous le texte) ;
 * - en bas, deux bandes de motif géométrique (esprit wax / kente) et la vague ivoire
 *   qui fait la transition avec la suite de la page.
 * Couleurs : uniquement les jetons du thème (cta, ochre, primary, background).
 */
export function HeroDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <svg
        className="absolute top-[96px] left-0 hidden h-[320px] w-[92px] text-ochre opacity-60 min-[1600px]:block"
        viewBox="0 0 92 320"
        fill="none"
        stroke="currentColor"
      >
        {[60, 180, 300].map((cy) => (
          <g key={cy} strokeWidth="5">
            <path d={`M-10 ${cy - 62} L52 ${cy} L-10 ${cy + 62}`} />
            <path d={`M-10 ${cy - 38} L28 ${cy} L-10 ${cy + 38}`} />
            <path d={`M-10 ${cy - 14} L4 ${cy} L-10 ${cy + 14}`} />
          </g>
        ))}
      </svg>

      <svg
        className="absolute inset-x-0 bottom-0 h-14 w-full sm:h-20 lg:h-[100px]"
        viewBox="0 0 1440 110"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <pattern id="hero-kente" width="22" height="22" patternUnits="userSpaceOnUse">
            <rect width="22" height="22" className="fill-primary" />
            <path d="M11 2 L20 11 L11 20 L2 11 Z" className="fill-cta" />
            <path d="M11 7 L15 11 L11 15 L7 11 Z" className="fill-primary" />
            <rect x="0" y="0" width="3" height="3" className="fill-ochre" />
          </pattern>
        </defs>
        {/* Repères mesurés sur la maquette : ivoire ~80 px au centre, bandes wax effilées sur les côtés. */}
        <path
          d="M0 8 Q170 26 310 60 L215 57 Q100 60 0 66 Z"
          fill="url(#hero-kente)"
          opacity="0.85"
        />
        <path
          d="M1440 -12 Q1250 26 1030 60 L1110 58 Q1300 40 1440 18 Z"
          fill="url(#hero-kente)"
          opacity="0.85"
        />
        <path
          d="M0 66 Q100 60 215 57 Q440 36 700 40 Q930 44 1110 58 Q1300 40 1440 18 L1440 110 L0 110 Z"
          className="fill-background"
        />
      </svg>
    </div>
  );
}
