import Image from "next/image";
import { storageUrl } from "@/lib/storage";
import type { ImageRef } from "@/lib/content/schema";

/** next/image a partir de un ImageRef (path de Storage o URL absoluta). */
export function Img({
  image,
  className,
  sizes,
  priority,
}: {
  image: ImageRef;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const src = /^https?:\/\//.test(image.path) ? image.path : storageUrl(image.path);
  return (
    <Image
      src={src}
      alt={image.alt}
      width={image.width ?? 1200}
      height={image.height ?? 800}
      sizes={sizes ?? "100vw"}
      priority={priority}
      className={className}
      placeholder={image.blurDataURL ? "blur" : undefined}
      blurDataURL={image.blurDataURL}
    />
  );
}
