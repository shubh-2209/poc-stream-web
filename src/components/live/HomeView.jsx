export default function HomeView({ onSelectMode }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-700 via-purple-600 to-blue-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-sm w-full">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">📡</div>
                    <h1 className="text-3xl font-bold text-gray-800">Live Stream</h1>
                    <p className="text-gray-500 text-sm mt-2">WebRTC • Zero Latency</p>
                </div>
                <div className="space-y-3">
                    <button
                        onClick={() => onSelectMode('broadcaster')}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl text-lg transition transform hover:scale-105 shadow"
                    >
                        🎥 Start Broadcast
                    </button>
                    <button
                        onClick={() => onSelectMode('viewer')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg transition transform hover:scale-105 shadow"
                    >
                        📺 Watch Live
                    </button>
                </div>
            </div>
        </div>
    )
}