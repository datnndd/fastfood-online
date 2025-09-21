import OptionPicker from './OptionPicker.jsx'

export default function ItemCard({ item, pick, setPick }){
// pick shape: { [itemId]: [optionId, ...] }
const chosen = pick[item.id] || []


return (
<div className="border rounded-xl bg-white p-4 flex gap-4">
<img src={item.image_url || 'https://via.placeholder.com/96'} alt={item.name} className="w-24 h-24 object-cover rounded-lg" />
<div className="flex-1">
<div className="flex items-center justify-between">
<div>
<h3 className="font-semibold">{item.name}</h3>
<p className="text-sm text-gray-500">{item.category}</p>
</div>
<div className="font-semibold">{Number(item.price).toLocaleString()} đ</div>
</div>
{Array.isArray(item.option_groups) && item.option_groups.map((g) => (
  <div key={g.id} className="mt-2">
    <div className="text-sm font-medium">
      {g.name}{g.required ? ' *' : ''}
    </div>
    <OptionPicker
      group={g}
      value={pick[item.id] || []}
      onChange={(ids) => setPick({ ...pick, [item.id]: ids })}
    />
  </div>
))}

</div>
</div>
)
}