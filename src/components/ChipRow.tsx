"use client";

const CHIPS = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "windows", label: "Windows" },
  { id: "browser", label: "Browser" },
  { id: "linux", label: "Linux" },
  { id: "mac", label: "Mac" },
  { id: "android", label: "Android" },
] as const;

export type ChipId = (typeof CHIPS)[number]["id"];

type Props = {
  active: ChipId;
  onChange: (id: ChipId) => void;
};

export function ChipRow({ active, onChange }: Props) {
  return (
    <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
      {CHIPS.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => onChange(chip.id)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-[11px] font-extrabold transition-colors ${
            active === chip.id
              ? "bg-[#C026D3] text-[#FFF1F7]"
              : "border border-[#C026D3]/40 text-[#E9D5FF] hover:border-[#FF4D8D]"
          }`}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
