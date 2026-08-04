"use client";

import { useState } from "react";
import { photoUrl, type ListingPhoto } from "@/lib/types";

export default function ListingGallery({
  photos,
  title,
}: {
  photos: ListingPhoto[];
  title: string;
}) {
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const current = photos[selected];

  return (
    <>
      <div className="overflow-hidden rounded-[8px] bg-slate-100">
        <div
          className={`aspect-[16/10] bg-slate-100 ${current ? "cursor-zoom-in" : ""}`}
          onClick={() => current && setLightbox(true)}
        >
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl(current.storage_path)}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl text-slate-300">
              TP
            </div>
          )}
        </div>
      </div>

      {photos.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {photos.slice(0, 5).map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setSelected(i)}
              aria-label={`Ver foto ${i + 1}`}
              className={`aspect-square overflow-hidden rounded-[6px] bg-slate-100 outline-none ring-2 transition-all ${
                i === selected
                  ? "ring-brand"
                  : "ring-transparent hover:ring-slate-300"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl(photo.storage_path)}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {lightbox && current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Visor de imagen"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            aria-label="Cerrar visor"
            onClick={() => setLightbox(false)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-2xl font-light text-white hover:bg-white/30"
          >
            ×
          </button>

          <div
            className="relative max-h-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl(current.storage_path)}
              alt={title}
              className="max-h-[88vh] max-w-full rounded-lg object-contain"
            />

            {photos.length > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Foto ${i + 1}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(i);
                    }}
                    className={`h-1.5 rounded-full bg-white transition-all ${
                      i === selected ? "w-6 opacity-100" : "w-1.5 opacity-40"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Foto anterior"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected((s) => (s - 1 + photos.length) % photos.length);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl text-white hover:bg-white/30"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Foto siguiente"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected((s) => (s + 1) % photos.length);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl text-white hover:bg-white/30"
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
