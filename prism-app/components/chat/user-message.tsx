export function UserMessage({
  content,
  images,
}: {
  content: string
  images?: string[]
}) {
  return (
    <div className="flex w-full flex-col items-end gap-2">
      {images && images.length > 0 ? (
        <div className="flex max-w-[85%] flex-wrap justify-end gap-2 sm:max-w-[75%]">
          {images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="size-20 overflow-hidden rounded-xl border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src || '/placeholder.svg'}
                alt={`Uploaded clinical image ${i + 1}`}
                className="size-full object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}

      <div className="max-w-[85%] rounded-2xl rounded-br-md border border-border bg-card px-4 py-2.5 shadow-sm sm:max-w-[75%]">
        <p className="text-sm leading-relaxed text-card-foreground">
          {content}
        </p>
      </div>
    </div>
  )
}
