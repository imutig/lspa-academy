export default function DiagnosticPage() {
  return (
    <html lang="fr">
      <head>
        <title>Test CSS</title>
        <style dangerouslySetInnerHTML={{
          __html: `
            body { 
              background: red !important; 
              color: white !important;
              font-size: 24px !important;
            }
            .test-class {
              background: blue !important;
              padding: 20px !important;
              margin: 20px !important;
            }
          `
        }} />
      </head>
      <body>
        <h1>Test de diagnostic CSS</h1>
        <div className="test-class">
          Cette div devrait être bleue avec du padding
        </div>
        <div className="bg-red-500 p-4 m-4 text-white">
          Cette div utilise Tailwind (rouge avec padding)
        </div>
        <p>Si vous voyez du rouge et du bleu, les CSS fonctionnent</p>
      </body>
    </html>
  )
}
