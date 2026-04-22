interface SectionLabelProps {
  label: string
  heading: string
  size?: "h3" | "h4"
}

export function SectionLabel({ label, heading, size = "h3" }: SectionLabelProps) {
  return (
    <div>
      <span className="text-xs uppercase tracking-widest text-[#0040a4]">{label}</span>
      <div className="flex items-center gap-4 mt-2">
        <div className="h-[2px] w-[120px] bg-[#0040a4]" />
        {size === 'h3' ? (
          <h3 className="text-[36px] font-bold text-[#1e1e1e]">{heading}</h3>
        ) : (
          <h4 className="text-[30px] font-bold text-[#1e1e1e]">{heading}</h4>
        )}
      </div>
    </div>
  )
}
