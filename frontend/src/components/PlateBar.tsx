// PlateBar — purely presentational component showing IPF plate motif
// for a given weight in kg.

const PLATES: { kg: number; height: number; colorVar: string }[] = [
  { kg: 25,  height: 12, colorVar: 'var(--plate-25)' },
  { kg: 20,  height: 10, colorVar: 'var(--plate-20)' },
  { kg: 15,  height: 9,  colorVar: 'var(--plate-15)' },
  { kg: 10,  height: 7,  colorVar: 'var(--plate-10)' },
  { kg: 5,   height: 6,  colorVar: 'var(--plate-5)' },
  { kg: 2.5, height: 5,  colorVar: 'var(--plate-2_5)' },
]

const BAR_WEIGHT = 20

function computePerSidePlates(kg: number): { kg: number; colorVar: string; height: number }[] {
  if (kg <= BAR_WEIGHT) return []

  let remaining = (kg - BAR_WEIGHT) / 2
  const result: { kg: number; colorVar: string; height: number }[] = []

  for (const plate of PLATES) {
    while (remaining >= plate.kg - 0.01) {
      result.push(plate)
      remaining -= plate.kg
      remaining = Math.round(remaining * 100) / 100
    }
  }

  // If we couldn't account for the weight (remainder >= 0.5), return empty
  if (remaining >= 0.5) return []

  return result
}

export function PlateBar({ kg }: { kg: number }) {
  const plates = computePerSidePlates(kg)

  if (plates.length === 0) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '2px',
        height: '12px',
        marginTop: '3px',
      }}
      aria-hidden="true"
    >
      {plates.map((plate, i) => (
        <span
          key={i}
          style={{
            width: '3px',
            height: `${plate.height}px`,
            borderRadius: '1px',
            background: plate.colorVar,
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  )
}
