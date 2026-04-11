export default function Layout({ children }) {
    return (
        <div className="min-h-screen bg-gray-950">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {children}
            </div>
        </div>
    )
}