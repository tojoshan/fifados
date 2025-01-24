export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-fifa-blue">404</h1>
        <p className="text-2xl font-semibold mt-4">Página no encontrada</p>
        <p className="text-gray-600 mt-2">La página que buscas no existe o fue movida</p>
        <a href="/" className="btn-primary mt-8 inline-block">
          Volver al inicio
        </a>
      </div>
    </div>
  );
}
