import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 text-gray-800">
      {/* Header/Nav */}
      <header className="container mx-auto px-6 py-5">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">CryptoTrack</div>
          <nav className="hidden md:flex space-x-10">
            <Link href="#recursos" className="hover:text-blue-600 transition-colors">Recursos</Link>
            <Link href="#planos" className="hover:text-blue-600 transition-colors">Planos</Link>
            <Link href="#contato" className="hover:text-blue-600 transition-colors">Contato</Link>
          </nav>
          <div className="flex space-x-4">
            <Link href="/login" className="px-4 py-2 rounded hover:bg-gray-100 transition-colors">Entrar</Link>
            <Link href="/signup" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">Cadastrar</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 md:py-24 flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-bold text-center max-w-4xl mb-6">
          Simplifique o controle das suas criptomoedas
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 text-center max-w-2xl mb-10">
          Acompanhe, analise e otimize seus investimentos em criptomoedas com facilidade e precisão.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/signup" className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center">
            Começar grátis
          </Link>
          <Link href="#demo" className="px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-center">
            Ver demonstração
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="container mx-auto px-6 py-16 md:py-24">
        <h2 className="text-3xl font-bold text-center mb-16">Recursos principais</h2>
        <div className="grid md:grid-cols-3 gap-10">
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-100 p-4 rounded-full mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Acompanhamento em tempo real</h3>
            <p className="text-gray-600">Monitore o valor das suas criptomoedas com atualizações de preços em tempo real.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-100 p-4 rounded-full mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Análise de portfólio</h3>
            <p className="text-gray-600">Visualize a distribuição dos seus ativos e analise o desempenho ao longo do tempo.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-100 p-4 rounded-full mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Segurança avançada</h3>
            <p className="text-gray-600">Seus dados são protegidos com criptografia de ponta a ponta e autenticação de dois fatores.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="container mx-auto px-6 py-16 md:py-24 bg-white rounded-lg shadow-sm">
        <h2 className="text-3xl font-bold text-center mb-16">Planos simples e transparentes</h2>
        <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
          <div className="border border-gray-200 rounded-lg p-8 hover:shadow-md transition-shadow">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Gratuito</h3>
              <p className="text-gray-600 mb-4">Para começar a organizar suas criptomoedas</p>
              <div className="text-4xl font-bold">R$ 0</div>
              <p className="text-gray-500">Para sempre</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Acompanhamento de até 5 transações
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Atualizações diárias de preços
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Visualização básica de portfólio
              </li>
            </ul>
            <Link href="/signup" className="block text-center w-full py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
              Começar grátis
            </Link>
          </div>
          <div className="border-2 border-blue-600 rounded-lg p-8 relative shadow-md">
            <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg text-sm">
              Recomendado
            </div>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-gray-600 mb-4">Para investidores sérios</p>
              <div className="text-4xl font-bold">R$ 29</div>
              <p className="text-gray-500">por mês</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Acompanhamento ilimitado de criptomoedas
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Atualizações em tempo real
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Análises avançadas e relatórios
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Alertas de preço personalizados
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Exportação de dados fiscais
              </li>
            </ul>
            <Link href="/signup?plan=pro" className="block text-center w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Assinar Pro
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="bg-blue-600 text-white rounded-xl p-10 text-center">
          <h2 className="text-3xl font-bold mb-6">Comece a controlar suas criptomoedas hoje</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de investidores que já estão otimizando seus investimentos em criptomoedas.
          </p>
          <Link href="/signup" className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors">
            Criar conta grátis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-xl font-bold text-blue-600 mb-4 md:mb-0">CryptoTrack</div>
            <div className="flex space-x-6">
              <Link href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Termos</Link>
              <Link href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Privacidade</Link>
              <Link href="#" id="contato" className="text-gray-600 hover:text-blue-600 transition-colors">Contato</Link>
            </div>
          </div>
          <div className="text-center mt-8 text-gray-500">
            &copy; {new Date().getFullYear()} CryptoTrack. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
