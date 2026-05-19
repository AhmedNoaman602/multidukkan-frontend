
export default function StatBoxes({ stats = [] }) {
    if (!stats.length) return null

    const colorMap = {
        blue:   'text-blue-400',
        green:  'text-green-400',
        red:    'text-red-400',
        yellow: 'text-yellow-400',
        purple: 'text-purple-400',
        white:  'text-white',
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, i) => (
                <div
                    key={i}
                    className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4"
                >
                    <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
                    <p className={`text-2xl font-bold ${colorMap[stat.color] ?? 'text-white'}`}>
                        {stat.value}
                    </p>
                </div>
            ))}
        </div>
    )
}