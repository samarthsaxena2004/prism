import { useState } from 'react'
import { ImageModal } from '@/components/image-modal'

export function UserMessage({
  content,
  images,
}: {
  content: string
  images?: string[]
}) {
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)

  return (
    <div className="flex w-full flex-col items-end gap-2">
      {images && images.length > 0 ? (
        <div className="flex max-w-[85%] flex-wrap justify-end gap-2 sm:max-w-[75%]">
          {images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="size-20 overflow-hidden border-2 rounded-xl border-foreground bg-background cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setEnlargedImage(src)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src || '/placeholder.svg'}
                alt={`Uploaded document image ${i + 1}`}
                className="size-full object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}

      <div className="max-w-[85%] border-2 rounded-2xl border-foreground bg-card px-4 py-2.5 sm:max-w-[75%]">
        <p className="text-sm leading-relaxed text-card-foreground font-mono">
          {content}
        </p>
      </div>
      <ImageModal src={enlargedImage} onClose={() => setEnlargedImage(null)} />
    </div>
  )
}
