import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CLE Perfume",
    short_name: "CLE Perfume",
    description: "Discover luxury fragrances crafted for the modern individual.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/logo-cle-favicon.png",
        sizes: "873x609",
        type: "image/png",
      },
    ],
  };
}
