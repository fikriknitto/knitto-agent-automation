import {
  attachmentExtension,
  promptAttachmentImageSrc,
  promptAttachmentTitle,
  type PromptAttachment,
} from "../lib/prompt-attachment";

type PromptAttachmentChipProps = {
  attachment: PromptAttachment;
  index: number;
  disabled?: boolean;
  onRemove: () => void;
};

export function PromptAttachmentChip({
  attachment,
  index,
  disabled,
  onRemove,
}: PromptAttachmentChipProps) {
  return (
    <figure
      className="relative m-0 cursor-default size-[100px] overflow-hidden rounded-xl border border-blue-400/30 bg-black/30 shadow-sm"
      title={promptAttachmentTitle(attachment)}
    >
      <span
        className="absolute top-1.5 left-1 z-10 min-w-[1.1rem] rounded bg-slate-900/90 px-1 text-center text-[0.65rem] font-semibold leading-[1.1rem] text-slate-200"
        aria-hidden="true"
      >
        {index + 1}
      </span>
      {attachment.kind === "image" ? (
        <img
          className="block h-full w-full object-cover"
          src={promptAttachmentImageSrc(attachment)}
          alt={attachment.name}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 p-1.5">
          <span className="text-[0.7rem] font-bold tracking-wide text-blue-300">
            {attachmentExtension(attachment.name)}
          </span>
          <span className="max-w-full line-clamp-1 text-center text-[0.55rem] text-slate-400">
            {attachment.name}
          </span>
        </div>
      )}
      <button
        type="button"
        className="absolute right-1 top-1 z-10 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-0 text-sm leading-none text-slate-100 outline-none hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Hapus lampiran"
        title="Hapus lampiran"
        disabled={disabled}
        onClick={onRemove}
      >
        ×
      </button>
    </figure>
  );
}

export function ChatAttachments({ attachments }: { attachments: PromptAttachment[] }) {
  if (!attachments.length) return null;

  return (
    <div className="flex flex-wrap gap-2" aria-label="Lampiran">
      {attachments.map((attachment, index) => (
        <figure
          key={`${attachment.storagePath}-${index}`}
          className="relative m-0 h-[4.5rem] w-[4.5rem] overflow-hidden rounded-xl border border-blue-400/30 bg-black/30 shadow-sm"
          title={promptAttachmentTitle(attachment)}
        >
          <span
            className="absolute bottom-1 left-1 z-[1] min-w-[1.1rem] rounded bg-slate-900/90 px-1 text-center text-[0.65rem] font-semibold leading-[1.1rem] text-slate-200"
            aria-hidden="true"
          >
            {index + 1}
          </span>
          {attachment.kind === "image" ? (
            <img
              className="block h-full w-full object-cover"
              src={promptAttachmentImageSrc(attachment)}
              alt={attachment.name}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 p-1.5">
              <span className="text-[0.7rem] font-bold tracking-wide text-blue-300">
                {attachmentExtension(attachment.name)}
              </span>
              <span className="max-w-full truncate text-center text-[0.55rem] text-slate-400">
                {attachment.name}
              </span>
            </div>
          )}
        </figure>
      ))}
    </div>
  );
}

type PromptAttachmentsProps = {
  attachments: PromptAttachment[];
  disabled?: boolean;
  onRemove: (index: number) => void;
};

export function PromptAttachments({ attachments, disabled, onRemove }: PromptAttachmentsProps) {
  if (!attachments.length) return null;

  return (
    <div className="mb-2.5 flex flex-wrap gap-2" aria-label="Lampiran">
      {attachments.map((attachment, index) => (
        <PromptAttachmentChip
          key={`${attachment.storagePath}-${index}`}
          attachment={attachment}
          index={index}
          disabled={disabled}
          onRemove={() => onRemove(index)}
        />
      ))}
    </div>
  );
}
