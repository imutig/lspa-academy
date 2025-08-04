export default function TestCSSPage() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold text-white mb-8">Test CSS avec CDN Tailwind</h1>
      
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-2xl text-white mb-4">Section 1</h2>
        <p className="text-gray-300">Ce texte devrait être gris clair sur fond gris foncé</p>
      </div>
      
      <div className="bg-blue-600 p-6 rounded-lg mb-6">
        <h2 className="text-2xl text-white mb-4">Section 2</h2>
        <p className="text-white">Ce texte devrait être blanc sur fond bleu</p>
      </div>
      
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-lg">
        <h2 className="text-2xl text-white mb-4">Section avec gradient</h2>
        <p className="text-white">Gradient de purple à pink</p>
      </div>
    </div>
  )
}
