import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cost estimator",
  description: "Create a practical preliminary budget estimate for your Buildora project.",
};

export default function EstimateLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
