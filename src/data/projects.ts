export type ProjectCategory =
  | "Residential"
  | "Commercial"
  | "RCC"
  | "Interior"
  | "Renovation";

export type Project = {
  slug: string;
  name: string;
  category: ProjectCategory;
  location: string;
  overview: string;
  scope: string[];
  details: {
    year: string;
    size: string;
    style: string;
    timeline: string;
  };
  gallery: string[];
};

export const projectCategories: ProjectCategory[] = [
  "Residential",
  "Commercial",
  "RCC",
  "Interior",
  "Renovation",
];

export const projects: Project[] = [
  {
    slug: "harbor-grove-residence",
    name: "Harbor Grove Residence",
    category: "Residential",
    location: "Bengaluru",
    overview:
      "A full-home transformation focused on better daylight, smoother circulation, and a warmer material palette for everyday living.",
    scope: [
      "Structural updates and selective demolition",
      "Interior redesign for living, dining, and bedroom spaces",
      "Custom cabinetry and finish coordination",
      "Lighting and styling direction for a cohesive residential experience",
    ],
    details: {
      year: "2024",
      size: "3,200 sq ft",
      style: "Contemporary warm minimal",
      timeline: "9 months",
    },
    gallery: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    slug: "skyline-studio-offices",
    name: "Skyline Studio Offices",
    category: "Commercial",
    location: "Pune",
    overview:
      "A workplace fit-out designed for client experience, flexible team collaboration, and a premium professional identity.",
    scope: [
      "Commercial interior planning and fit-out",
      "Reception and meeting room experience design",
      "Workstation zoning and material styling",
      "Execution supervision and finish reviews",
    ],
    details: {
      year: "2023",
      size: "4,100 sq ft",
      style: "Minimal corporate",
      timeline: "7 months",
    },
    gallery: [
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    slug: "oakline-courtyard-villa",
    name: "Oakline Courtyard Villa",
    category: "RCC",
    location: "Hyderabad",
    overview:
      "A new-build residence shaped around structural clarity, courtyard planning, and a seamless indoor-outdoor experience.",
    scope: [
      "Full RCC construction management",
      "Structural planning and execution coordination",
      "Courtyard-focused planning and elevation detailing",
      "Material and finish oversight across the build",
    ],
    details: {
      year: "2024",
      size: "4,600 sq ft",
      style: "Modern courtyard living",
      timeline: "12 months",
    },
    gallery: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    slug: "atelier-dwell-residence",
    name: "Atelier Dwell Residence",
    category: "Interior",
    location: "Chennai",
    overview:
      "A layered interior refresh that balanced natural textures, elegant materiality, and efficient family circulation.",
    scope: [
      "Full interior design and material selection",
      "Furniture layout and styling direction",
      "Lighting, joinery, and detailing coordination",
      "Walkthrough and final styling guidance",
    ],
    details: {
      year: "2022",
      size: "2,800 sq ft",
      style: "Warm modern luxury",
      timeline: "5 months",
    },
    gallery: [
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    slug: "sandstone-loft-renovation",
    name: "Sandstone Loft Renovation",
    category: "Renovation",
    location: "Mumbai",
    overview:
      "A compact urban home transformed into a lighter, more efficient living environment through careful reconfiguration and detailing.",
    scope: [
      "Renovation planning and design updates",
      "Interior reconfiguration and material refresh",
      "Custom storage and joinery changes",
      "Handover and finishing supervision",
    ],
    details: {
      year: "2023",
      size: "1,500 sq ft",
      style: "Urban refined",
      timeline: "6 months",
    },
    gallery: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
    ],
  },
];

export function getProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug);
}
