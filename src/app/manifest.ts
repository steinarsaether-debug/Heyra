import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Heyra",
    short_name: "Heyra",
    description: "Hunting and fishing marketplace for Norway.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f2ea",
    theme_color: "#1b4332",
    lang: "nb",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
      },
    ],
  };
}
