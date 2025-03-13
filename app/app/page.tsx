"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Cookies from "js-cookie";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Dados simulados para visualização
const mockPortfolio = {
  totalValue: 15750.42,
  profit: 2345.67,
  profitPercentage: 17.5,
  distribution: [
    { name: "Bitcoin", symbol: "BTC", value: 8500, percentage: 54, color: "rgb(247, 147, 26)" },
    { name: "Ethereum", symbol: "ETH", value: 3750, percentage: 24, color: "rgb(114, 114, 182)" },
    { name: "Cardano", symbol: "ADA", value: 1200, percentage: 8, color: "rgb(0, 51, 173)" },
    { name: "Solana", symbol: "SOL", value: 1050, percentage: 7, color: "rgb(0, 255, 163)" },
    { name: "Polkadot", symbol: "DOT", value: 950, percentage: 6, color: "rgb(230, 0, 122)" },
    { name: "Outros", symbol: "", value: 300.42, percentage: 1, color: "rgb(180, 180, 180)" }
  ]
}

const mockCryptos = [
  { name: "Bitcoin", symbol: "BTC", price: 258465.32, change24h: 2.34, volume: "29.4B" },
  { name: "Ethereum", symbol: "ETH", price: 12980.15, change24h: -0.87, volume: "12.7B" },
  { name: "Cardano", symbol: "ADA", price: 2.13, change24h: 5.61, volume: "3.8B" },
  { name: "Solana", symbol: "SOL", price: 630.42, change24h: 12.45, volume: "5.2B" },
  { name: "Polkadot", symbol: "DOT", price: 94.31, change24h: -1.23, volume: "1.9B" },
  { name: "Binance Coin", symbol: "BNB", price: 1485.65, change24h: 0.54, volume: "4.3B" },
]

const mockTransactions = [
  { date: "2023-11-15", type: "Compra", crypto: "Bitcoin", amount: 0.05, price: 235000, total: 11750 },
  { date: "2023-12-01", type: "Venda", crypto: "Ethereum", amount: 1.2, price: 11500, total: 13800 },
  { date: "2024-01-10", type: "Compra", crypto: "Cardano", amount: 500, price: 2.20, total: 1100 },
  { date: "2024-02-05", type: "Compra", crypto: "Solana", amount: 2.5, price: 520.30, total: 1300.75 },
]

export default function AppPage() {
  const [userName, setUserName] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("token");
    const name = Cookies.get("name");
    
    if (!token) {
      router.push("/login");
      return;
    }
    
    if (name) {
      setUserName(name);
    }
  }, [router]);

  const logout = () => {
    Cookies.remove("token");
    Cookies.remove("name");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header/Navbar */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-blue-600">CryptoTrack</div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/app" className="text-blue-600 font-medium">Dashboard</Link>
              <Link href="/app/portfolio" className="text-gray-600 hover:text-blue-600 transition-colors">Portfólio</Link>
              <Link href="/app/transactions" className="text-gray-600 hover:text-blue-600 transition-colors">Transações</Link>
              <Link href="/app/settings" className="text-gray-600 hover:text-blue-600 transition-colors">Configurações</Link>
            </nav>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">Olá, {userName}</div>
              <Button 
                variant="outline" 
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={logout}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-500 text-sm font-normal">Valor Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {mockPortfolio.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-500 text-sm font-normal">Lucro/Prejuízo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className={`text-2xl font-bold ${mockPortfolio.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {mockPortfolio.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className={`ml-2 px-2 py-1 rounded-full text-xs ${mockPortfolio.profit >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {mockPortfolio.profit >= 0 ? '+' : ''}{mockPortfolio.profitPercentage}%
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-500 text-sm font-normal">Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockPortfolio.distribution.length}</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Portfolio Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border border-gray-200 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Cotações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-500 text-sm border-b">
                      <th className="pb-2 font-medium">Nome</th>
                      <th className="pb-2 font-medium">Preço</th>
                      <th className="pb-2 font-medium">24h</th>
                      <th className="pb-2 font-medium">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockCryptos.map((crypto, index) => (
                      <tr key={index} className="border-b border-gray-100 text-sm">
                        <td className="py-3 font-medium">{crypto.name} <span className="text-gray-500">{crypto.symbol}</span></td>
                        <td className="py-3">R$ {crypto.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className={`py-3 ${crypto.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h}%
                        </td>
                        <td className="py-3 text-gray-500">R$ {crypto.volume}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle>Distribuição</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  {mockPortfolio.distribution.map((asset, index) => (
                    <div 
                      key={index}
                      className="h-full float-left" 
                      style={{ 
                        width: `${asset.percentage}%`, 
                        backgroundColor: asset.color 
                      }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                {mockPortfolio.distribution.map((asset, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: asset.color }}
                      />
                      <span className="text-sm">
                        {asset.name} {asset.symbol && `(${asset.symbol})`}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{asset.percentage}%</span>
                      <span className="text-gray-500 ml-2">
                        R$ {asset.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Transactions */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Transações Recentes</CardTitle>
              <Link href="/app/transactions" className="text-sm text-blue-600 hover:underline">
                Ver todas
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm border-b">
                    <th className="pb-2 font-medium">Data</th>
                    <th className="pb-2 font-medium">Tipo</th>
                    <th className="pb-2 font-medium">Criptomoeda</th>
                    <th className="pb-2 font-medium">Quantidade</th>
                    <th className="pb-2 font-medium">Preço</th>
                    <th className="pb-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {mockTransactions.map((tx, index) => (
                    <tr key={index} className="border-b border-gray-100 text-sm">
                      <td className="py-3">{new Date(tx.date).toLocaleDateString('pt-BR')}</td>
                      <td className={`py-3 font-medium ${tx.type === 'Compra' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type}
                      </td>
                      <td className="py-3">{tx.crypto}</td>
                      <td className="py-3">{tx.amount}</td>
                      <td className="py-3">R$ {tx.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 font-medium">R$ {tx.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
