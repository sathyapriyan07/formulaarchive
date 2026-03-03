import clsx from 'clsx'

interface TabItem {
  value: string
  label: string
}

interface TabsProps {
  tabs: TabItem[]
  value: string
  onChange: (value: string) => void
}

export default function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={clsx(
            'whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors',
            value === tab.value ? 'bg-f1-red text-white' : 'bg-f1-dark text-gray-300 hover:bg-f1-gray',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
