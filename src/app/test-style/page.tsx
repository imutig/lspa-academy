'use client'

export default function TestStylePage() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Test des styles</h1>
        
        {/* Test de base */}
        <div className="bg-white p-4 rounded mb-4">
          <p className="text-black">Ce texte devrait être noir sur fond blanc</p>
        </div>
        
        {/* Test avec thème sombre */}
        <div className="bg-gray-800 p-4 rounded mb-4">
          <p className="text-white">Ce texte devrait être blanc sur fond gris foncé</p>
        </div>
        
        {/* Test Tailwind avancé */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-lg shadow-lg mb-4">
          <p className="text-white font-semibold">Gradient avec ombre</p>
        </div>
        
        {/* Test de la table */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
          <h2 className="text-xl font-semibold text-white mb-4">Table de test</h2>
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-200">Colonne 1</th>
                <th className="text-left p-4 font-medium text-gray-200">Colonne 2</th>
                <th className="text-left p-4 font-medium text-gray-200">Colonne 3</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-700/50 hover:bg-gray-800/30">
                <td className="p-4 text-white">Donnée 1</td>
                <td className="p-4 text-white">Donnée 2</td>
                <td className="p-4 text-white">Donnée 3</td>
              </tr>
              <tr className="border-b border-gray-700/50 hover:bg-gray-800/30">
                <td className="p-4 text-white">Donnée 4</td>
                <td className="p-4 text-white">Donnée 5</td>
                <td className="p-4 text-white">Donnée 6</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
