"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

/**
 * Click-to-load YouTube embed. Renders only a lazy thumbnail + play button, so
 * the ~1MB YouTube player (and its third-party requests) is fetched only when a
 * visitor actually chooses to watch.
 */
export default function YouTubeFacade({
  embedUrl,
  thumbnail,
  title,
}: {
  embedUrl: string;
  thumbnail: string;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);
  const src = `${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=1&rel=0`;

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-slate-900"
      style={{ aspectRatio: "16 / 9" }}
    >
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 h-full w-full cursor-pointer"
          aria-label={`Play video: ${title}`}
        >
          <Image
            src={thumbnail}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 960px"
            className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span
              className="flex items-center justify-center w-20 h-20 rounded-full text-white shadow-lg transition-transform group-hover:scale-110 group-focus-visible:scale-110"
              style={{ backgroundColor: "#0d9488" }}
            >
              <Play size={32} fill="currentColor" className="ml-1" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
