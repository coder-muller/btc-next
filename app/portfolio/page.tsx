"use client";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import axios from "axios";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Cookies from "js-cookie";
import { ArrowDown, ArrowUp, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { CoinGeckoItem, CryptoData, DbPortfolio, DbTransaction } from "../types";

interface PortfolioAnalytics {
  totalInvested: number;
  currentValue: number;
  totalProfit: number;
  profitPercentage: number;
  monthlyProfitPercentage: number;
  bestPerforming: {
    name: string;
    symbol: string;
    profit: number;
    profitPercentage: number;
  };
  worstPerforming: {
    name: string;
    symbol: string;
    profit: number;
    profitPercentage: number;
  };
  assets: {
    name: string;
    symbol: string;
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    totalInvested: number;
    currentValue: number;
    profit: number;
    profitPercentage: number;
    transactions: DbTransaction[];
  }[];
}

export default function PortfolioPage() {
  const [userName, setUserName] = useState("");
  const router = useRouter();
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolios, setPortfolios] = useState<DbPortfolio[]>([]);
  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null);
  
  // Filtros
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortBy, setSortBy] = useState<string>("profit"); // profit, invested, current
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedAsset, setSelectedAsset] = useState<string>("all");

  // Verificar autenticação
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

  // Buscar dados das criptomoedas
  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "https://api.coingecko.com/api/v3/coins/markets",
          {
            params: {
              vs_currency: "brl",
              order: "market_cap_desc",
              per_page: 50,
              page: 1,
              sparkline: false,
              price_change_percentage: "24h"
            }
          }
        );

        const formattedData: CryptoData[] = response.data.map((coin: CoinGeckoItem) => ({
          name: coin.name,
          symbol: coin.symbol.toUpperCase(),
          price: coin.current_price,
          change24h: coin.price_change_percentage_24h,
          volume: `${(coin.total_volume / 1000000000).toFixed(1)}B`,
          image: coin.image
        }));

        setCryptoData(formattedData);
        setError(null);
      } catch (err) {
        console.error("Erro ao buscar dados de criptomoedas:", err);
        setError("Não foi possível carregar as cotações.");
      } finally {
        setLoading(false);
      }
    };

    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Buscar dados do portfólio
  useEffect(() => {
    const fetchPortfolioData = async () => {
      const token = Cookies.get("token");
      if (!token) return;
      
      try {
        setLoading(true);
        const response = await axios.get('/api/transactions', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setPortfolios(response.data.portfolios || []);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar dados do portfólio:', err);
        setError('Não foi possível carregar seu portfólio');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPortfolioData();
  }, []);

  // Calcular análises do portfólio
  useEffect(() => {
    if (!portfolios.length || !cryptoData.length) return;

    const analytics: PortfolioAnalytics = {
      totalInvested: 0,
      currentValue: 0,
      totalProfit: 0,
      profitPercentage: 0,
      monthlyProfitPercentage: 0,
      bestPerforming: {
        name: "",
        symbol: "",
        profit: 0,
        profitPercentage: 0
      },
      worstPerforming: {
        name: "",
        symbol: "",
        profit: 0,
        profitPercentage: 0
      },
      assets: []
    };

    // Filtrar transações por data se houver filtro
    const filterTransactionsByDate = (transactions: DbTransaction[]) => {
      if (!dateRange?.from) return transactions;
      
      const fromDate = dateRange.from;
      const toDate = dateRange.to;
      
      return transactions.filter(tx => {
        const txDate = new Date(tx.date);
        if (toDate) {
          return txDate >= fromDate && txDate <= toDate;
        }
        return txDate >= fromDate;
      });
    };

    // Calcular métricas para cada ativo
    portfolios.forEach(portfolio => {
      const crypto = cryptoData.find(c => 
        c.symbol.toUpperCase() === portfolio.symbol.toUpperCase() ||
        c.name.toLowerCase() === portfolio.name.toLowerCase()
      );

      if (!crypto) return;

      const filteredTransactions = filterTransactionsByDate(portfolio.transactions);
      
      let assetInvested = 0;
      let totalQuantity = 0;

      filteredTransactions.forEach(tx => {
        if (tx.type === "COMPRA") {
          assetInvested += tx.totalAmount;
          totalQuantity += tx.quantity;
        } else {
          assetInvested -= tx.totalAmount;
          totalQuantity -= tx.quantity;
        }
      });

      const currentValue = totalQuantity * crypto.price;
      const profit = currentValue - assetInvested;
      const profitPercentage = assetInvested > 0 ? (profit / assetInvested) * 100 : 0;

      analytics.assets.push({
        name: portfolio.name,
        symbol: portfolio.symbol,
        quantity: totalQuantity,
        averagePrice: totalQuantity > 0 ? assetInvested / totalQuantity : 0,
        currentPrice: crypto.price,
        totalInvested: assetInvested,
        currentValue,
        profit,
        profitPercentage,
        transactions: filteredTransactions
      });

      analytics.totalInvested += assetInvested;
      analytics.currentValue += currentValue;
    });

    // Calcular métricas gerais
    analytics.totalProfit = analytics.currentValue - analytics.totalInvested;
    analytics.profitPercentage = analytics.totalInvested > 0 
      ? (analytics.totalProfit / analytics.totalInvested) * 100 
      : 0;

    // Calcular rendimento mensal (estimativa simples)
    const oldestTx = portfolios
      .flatMap(p => p.transactions)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    
    if (oldestTx) {
      const months = (new Date().getTime() - new Date(oldestTx.date).getTime()) / (1000 * 60 * 60 * 24 * 30);
      analytics.monthlyProfitPercentage = analytics.profitPercentage / months;
    }

    // Identificar melhor e pior desempenho
    analytics.assets.sort((a, b) => b.profitPercentage - a.profitPercentage);
    
    if (analytics.assets.length > 0) {
      analytics.bestPerforming = {
        name: analytics.assets[0].name,
        symbol: analytics.assets[0].symbol,
        profit: analytics.assets[0].profit,
        profitPercentage: analytics.assets[0].profitPercentage
      };
      
      analytics.worstPerforming = {
        name: analytics.assets[analytics.assets.length - 1].name,
        symbol: analytics.assets[analytics.assets.length - 1].symbol,
        profit: analytics.assets[analytics.assets.length - 1].profit,
        profitPercentage: analytics.assets[analytics.assets.length - 1].profitPercentage
      };
    }

    // Aplicar ordenação
    analytics.assets.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "profit":
          comparison = b.profit - a.profit;
          break;
        case "invested":
          comparison = b.totalInvested - a.totalInvested;
          break;
        case "current":
          comparison = b.currentValue - a.currentValue;
          break;
        default:
          comparison = b.profit - a.profit;
      }

      return sortOrder === "desc" ? comparison : -comparison;
    });

    // Filtrar por ativo específico se selecionado
    if (selectedAsset !== "all") {
      analytics.assets = analytics.assets.filter(
        asset => asset.symbol.toLowerCase() === selectedAsset.toLowerCase()
      );
    }

    setAnalytics(analytics);
  }, [portfolios, cryptoData, dateRange, sortBy, sortOrder, selectedAsset]);

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
            <div className="text-2xl font-bold text-blue-600 cursor-pointer" onClick={() => router.push("/app")}>
              CryptoTrack
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/app" className="text-gray-600 hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <Link href="/app/portfolio" className="text-blue-600 font-medium">
                Portfólio
              </Link>
              <Link href="/app/transactions" className="text-gray-600 hover:text-blue-600 transition-colors">
                Transações
              </Link>
              <Link href="/app/settings" className="text-gray-600 hover:text-blue-600 transition-colors">
                Configurações
              </Link>
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Análise do Portfólio</h1>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Filtro de Data */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal w-full sm:w-[240px]",
                    !dateRange && "text-gray-500"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                    )
                  ) : (
                    "Selecionar período"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            {/* Filtro de Ordenação */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profit">Rendimento</SelectItem>
                <SelectItem value="invested">Valor Investido</SelectItem>
                <SelectItem value="current">Valor Atual</SelectItem>
              </SelectContent>
            </Select>

            {/* Ordem (Asc/Desc) */}
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "desc" ? (
                <ArrowDown className="h-4 w-4" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>

            {/* Filtro de Ativo */}
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por ativo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os ativos</SelectItem>
                {cryptoData.map((crypto) => (
                  <SelectItem key={crypto.symbol} value={crypto.symbol.toLowerCase()}>
                    {crypto.name} ({crypto.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="text-gray-600">Carregando análises...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button
                onClick={() => setLoading(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        ) : !analytics || analytics.assets.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-500 mb-4">
                Nenhuma transação encontrada para o período selecionado.
              </p>
              <Button
                onClick={() => setDateRange(undefined)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card className="border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-500 text-sm font-normal">
                    Total Investido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {analytics.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-500 text-sm font-normal">
                    Valor Atual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {analytics.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-500 text-sm font-normal">
                    Rendimento Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <div className={`text-2xl font-bold ${
                      analytics.totalProfit > 0 
                        ? 'text-green-600' 
                        : analytics.totalProfit < 0 
                        ? 'text-red-600' 
                        : 'text-gray-600'
                    }`}>
                      R$ {analytics.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      analytics.profitPercentage > 0 
                        ? 'bg-green-100 text-green-800' 
                        : analytics.profitPercentage < 0 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {analytics.profitPercentage > 0 ? '+' : ''}
                      {analytics.profitPercentage.toFixed(2)}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-500 text-sm font-normal">
                    Rendimento Mensal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    analytics.monthlyProfitPercentage > 0 
                      ? 'text-green-600' 
                      : analytics.monthlyProfitPercentage < 0 
                      ? 'text-red-600' 
                      : 'text-gray-600'
                  }`}>
                    {analytics.monthlyProfitPercentage > 0 ? '+' : ''}
                    {analytics.monthlyProfitPercentage.toFixed(2)}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Melhor e Pior Desempenho */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-green-600">Melhor Desempenho</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-lg font-medium">
                      {analytics.bestPerforming.name} ({analytics.bestPerforming.symbol})
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-green-600">
                        +{analytics.bestPerforming.profitPercentage.toFixed(2)}%
                      </div>
                      <div className="text-gray-600">
                        R$ {analytics.bestPerforming.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-red-600">Pior Desempenho</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-lg font-medium">
                      {analytics.worstPerforming.name} ({analytics.worstPerforming.symbol})
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-red-600">
                        {analytics.worstPerforming.profitPercentage.toFixed(2)}%
                      </div>
                      <div className="text-gray-600">
                        R$ {analytics.worstPerforming.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Ativos */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle>Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-500 text-sm border-b">
                        <th className="pb-2 font-medium">Ativo</th>
                        <th className="pb-2 font-medium">Quantidade</th>
                        <th className="pb-2 font-medium">Preço Médio</th>
                        <th className="pb-2 font-medium">Preço Atual</th>
                        <th className="pb-2 font-medium">Total Investido</th>
                        <th className="pb-2 font-medium">Valor Atual</th>
                        <th className="pb-2 font-medium">Rendimento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.assets.map((asset, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-4">
                            <div className="flex items-center">
                              {cryptoData.find(c => c.symbol === asset.symbol)?.image && (
                                <Image
                                  src={cryptoData.find(c => c.symbol === asset.symbol)?.image || ""}
                                  alt={asset.name}
                                  width={24}
                                  height={24}
                                  className="mr-2"
                                />
                              )}
                              <div>
                                <div className="font-medium">{asset.name}</div>
                                <div className="text-sm text-gray-500">{asset.symbol}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">{asset.quantity.toFixed(8)}</td>
                          <td className="py-4">
                            R$ {asset.averagePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4">
                            R$ {asset.currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4">
                            R$ {asset.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4">
                            R$ {asset.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <div className={`font-medium ${
                                asset.profit > 0 
                                  ? 'text-green-600' 
                                  : asset.profit < 0 
                                  ? 'text-red-600' 
                                  : 'text-gray-600'
                              }`}>
                                R$ {asset.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs ${
                                asset.profitPercentage > 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : asset.profitPercentage < 0 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {asset.profitPercentage > 0 ? '+' : ''}
                                {asset.profitPercentage.toFixed(2)}%
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
