export default function Slider({ label, value, min, max, step = 1, onChange, format = (v) => v }) {
  return (
    <label className="block">
      <span className="flex justify-between font-bold">
        <span>{label}</span>
        <span className="chip bg-sun-pale">{format(value)}</span>
      </span>
      <input type="range" className="w-full h-10 accent-[var(--theme)]" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={String(format(value))} />
    </label>
  );
}
