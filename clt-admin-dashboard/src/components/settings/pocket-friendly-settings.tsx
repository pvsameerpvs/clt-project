"use client"

interface PocketFriendlySettingsProps {
  configs: number[]
  onChange: (configs: number[]) => void
}

export function PocketFriendlySettings({ configs, onChange }: PocketFriendlySettingsProps) {
  const addPoint = () => onChange([...configs, 0])
  const removePoint = (index: number) => onChange(configs.filter((_, i) => i !== index))
  const updatePoint = (index: number, val: string) => {
    const newConfigs = [...configs]
    newConfigs[index] = Number(val)
    onChange(newConfigs)
  }

  return (
    <section className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
      <h2 className="text-xl font-bold mb-2 flex items-center gap-2">💸 Pocket Friendly Thresholds</h2>
      <p className="text-sm text-neutral-500 mb-6">Define the price points for the "Under X AED" buttons on the home page.</p>
      
      <div className="flex flex-wrap gap-4">
        {configs.map((price, index) => (
          <div key={index} className="flex gap-2 items-center bg-neutral-50 p-3 rounded-xl border">
            <span className="text-[10px] font-bold text-neutral-400 uppercase">Under</span>
            <input 
              type="number"
              className="w-20 border-b border-neutral-300 bg-transparent text-center font-bold outline-none focus:border-black"
              value={price}
              onChange={(e) => updatePoint(index, e.target.value)}
            />
            <span className="text-[10px] font-bold text-neutral-400 uppercase">AED</span>
            <button 
              onClick={() => removePoint(index)}
              className="ml-2 text-neutral-300 hover:text-red-500 transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
        
        <button 
          onClick={addPoint}
          className="border-2 border-dashed border-neutral-200 p-4 rounded-xl text-xs font-bold text-neutral-400 hover:border-black hover:text-black transition-all"
        >
          + Add Point
        </button>
      </div>
    </section>
  )
}
