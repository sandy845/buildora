export type Service = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  highlights: string[];
  include: string[];
};

export const services: Service[] = [
  {
    slug: "rcc-construction",
    title: "RCC Construction",
    shortDescription: "Structural construction designed for strength, compliance, and long-term durability.",
    description:
      "Buildora delivers RCC construction for homes, villas, and commercial structures with a focus on structural integrity, material quality, and build discipline. Every project is planned for long-term performance and efficient execution.",
    highlights: [
      "Structural design coordination",
      "Reinforcement detailing oversight",
      "Material quality checks",
      "Site supervision and execution control",
    ],
    include: [
      "Structural planning support",
      "Concrete quality monitoring",
      "Site coordination with contractors",
      "Execution guidance and milestone tracking",
    ],
  },
  {
    slug: "complete-home-construction",
    title: "Complete Home Construction",
    shortDescription: "Turnkey residential build solutions tailored to your lifestyle, budget, and site conditions.",
    description:
      "From planning to finishing, we manage complete home construction with practical design decisions, disciplined project management, and quality-focused craftsmanship. The result is a home that feels thoughtful, efficient, and ready to live in.",
    highlights: [
      "Full residential construction management",
      "Layout and finishing coordination",
      "Material and contractor oversight",
      "Handover planning and final walkthrough",
    ],
    include: [
      "Architectural coordination",
      "Execution planning and supervision",
      "Finishing and fit-out management",
      "Completion and handover support",
    ],
  },
  {
    slug: "interior-design",
    title: "Interior Design",
    shortDescription: "Function-first interior design that brings clarity, comfort, and visual elegance to every room.",
    description:
      "Our interior design approach focuses on how a space should feel and function day to day. We blend materials, layouts, and detailing to create spaces that are practical, warm, and enduring.",
    highlights: [
      "Space planning and layout design",
      "Material and color direction",
      "Furniture and styling coordination",
      "Lighting and detailing guidance",
    ],
    include: [
      "Mood boards and design direction",
      "Furniture and styling planning",
      "Material palette guidance",
      "Interior styling and detailing support",
    ],
  },
  {
    slug: "renovation",
    title: "Renovation",
    shortDescription: "Thoughtful transformation for aging spaces, outdated layouts, and lifestyle upgrades.",
    description:
      "Renovation projects need careful planning and execution to get the most value from the existing structure. We rework spaces with a view toward better function, stronger aesthetics, and fewer surprises during delivery.",
    highlights: [
      "Layout optimization and reconfiguration",
      "Structural and finishing updates",
      "Budget-conscious planning",
      "Phased execution support",
    ],
    include: [
      "Space reworking and improvement plans",
      "Material and finishing upgrades",
      "Phased renovation coordination",
      "Quality checks and final completion review",
    ],
  },
  {
    slug: "modular-kitchen",
    title: "Modular Kitchen",
    shortDescription: "Efficient kitchen layouts designed around storage, workflow, and everyday use.",
    description:
      "A modular kitchen balances efficiency and visual simplicity. We create kitchen systems that improve storage, function, and durability without overcomplicating the overall aesthetic.",
    highlights: [
      "Workflow-based kitchen planning",
      "Cabinet and storage optimization",
      "Finish and hardware coordination",
      "Integrated appliance planning",
    ],
    include: [
      "Layout and storage planning",
      "Cabinet system recommendations",
      "Finish and hardware coordination",
      "Space optimization guidance",
    ],
  },
  {
    slug: "bathroom-design",
    title: "Bathroom Design",
    shortDescription: "Well-planned bathrooms that feel calm, durable, and easy to maintain.",
    description:
      "Bathroom design needs a careful balance of layout, moisture management, material selection, and comfort. We create practical bathing spaces that feel refined and remain easy to maintain over time.",
    highlights: [
      "Optimized layout planning",
      "Waterproofing and finish guidance",
      "Fixture and tile coordination",
      "Comfort-focused detailing",
    ],
    include: [
      "Bathroom zoning and layout guidance",
      "Material and tile coordination",
      "Fixture placement planning",
      "Built-for-durability detailing",
    ],
  },
  {
    slug: "commercial-construction",
    title: "Commercial Construction",
    shortDescription: "Commercial spaces designed for operations, presentation, and long-term flexibility.",
    description:
      "Our commercial construction services support office, retail, and hospitality environments where function, image, and operational efficiency all matter. We create spaces that work for the business as well as the people inside them.",
    highlights: [
      "Commercial fit-out planning",
      "Brand-conscious interior direction",
      "Execution coordination and quality control",
      "Operational efficiency focus",
    ],
    include: [
      "Scope planning and execution strategy",
      "Commercial fit-out coordination",
      "Site supervision and quality checks",
      "Project delivery support",
    ],
  },
];

export const featuredServiceSlugs = [
  "complete-home-construction",
  "interior-design",
  "renovation",
];

export function getServiceBySlug(slug: string) {
  return services.find((service) => service.slug === slug);
}
