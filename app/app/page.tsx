"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import Cookies from "js-cookie";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CoinGeckoItem, CryptoData, DbPortfolio, DbTransaction, FormattedTransaction, PortfolioAsset } from "../types";

export default function AppPage() {
  const [userName, setUserName] = useState("");
  const router = useRouter();
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para o modal de transação
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"COMPRA" | "VENDA">("COMPRA");
  const [selectedCrypto, setSelectedCrypto] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  
  // Dados reais do usuário
  const [portfolios, setPortfolios] = useState<DbPortfolio[]>([]);
  const [transactions, setTransactions] = useState<FormattedTransaction[]>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

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

  // Função para buscar dados de criptomoedas da API do CoinGecko
  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        setLoading(true);
        // Buscando dados das 10 principais criptomoedas em BRL
        const response = await axios.get(
          "https://api.coingecko.com/api/v3/coins/markets",
          {
            params: {
              vs_currency: "brl",
              order: "market_cap_desc",
              per_page: 10,
              page: 1,
              sparkline: false,
              price_change_percentage: "24h"
            }
          }
        );

        // Formatando os dados para o formato que o app espera
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
        setError("Não foi possível carregar as cotações. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchCryptoData();

    // Configurar atualização a cada 10 minutos (60 0000ms)
    const interval = setInterval(fetchCryptoData, 600000);

    return () => clearInterval(interval);
  }, []);

  // Função para buscar dados do portfólio e transações do usuário
  useEffect(() => {
    const fetchUserData = async () => {
      const token = Cookies.get("token");
      if (!token) return;
      
      setLoadingPortfolio(true);
      
      try {
        const response = await axios.get('/api/transactions', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        const { portfolios } = response.data;
        setPortfolios(portfolios || []);
        
        // Extrair todas as transações em um único array ordenado por data
        const allTransactions = portfolios.flatMap((p: DbPortfolio) => 
          p.transactions.map((t: DbTransaction) => ({
            ...t,
            portfolioName: p.name,
            portfolioSymbol: p.symbol
          }))
        ).sort((a: DbTransaction, b: DbTransaction) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ).slice(0, 4); // Apenas as 4 mais recentes
        
        setTransactions(allTransactions);
        setPortfolioError(null);
      } catch (err) {
        console.error('Erro ao buscar dados do usuário:', err);
        setPortfolioError('Não foi possível carregar seu portfólio');
        setPortfolios([]);
        setTransactions([]);
      } finally {
        setLoadingPortfolio(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  // Calcular o valor total e distribuição do portfólio real
  const calculatePortfolio = () => {
    if (!portfolios.length || !cryptoData.length) {
      return {
        totalValue: 0,
        profit: 0,
        profitPercentage: 0,
        distribution: []
      };
    }
    
    let totalValue = 0;
    let totalInvested = 0;
    const distribution: PortfolioAsset[] = [];
    
    // Array de cores para os diferentes ativos
    const colors = [
      "rgb(247, 147, 26)", // Bitcoin
      "rgb(114, 114, 182)", // Ethereum
      "rgb(0, 51, 173)", // Cardano
      "rgb(0, 255, 163)", // Solana
      "rgb(230, 0, 122)", // Polkadot
      "rgb(255, 155, 0)", // Binance
      "rgb(52, 168, 83)", // Link
      "rgb(66, 133, 244)", // Outros
      "rgb(234, 67, 53)", // Outros
      "rgb(180, 180, 180)" // Outros
    ];
    
    // Calcular o valor total investido a partir de todas as transações
    portfolios.forEach(portfolio => {
      portfolio.transactions.forEach(tx => {
        if (tx.type === "COMPRA") {
          totalInvested += tx.totalAmount;
        } else if (tx.type === "VENDA") {
          totalInvested -= tx.totalAmount;
        }
      });
    });
    
    // Calcular o valor atual do portfólio
    portfolios.forEach((portfolio, index) => {
      // Encontrar o preço atual da criptomoeda
      const crypto = cryptoData.find(c => 
        c.symbol.toUpperCase() === portfolio.symbol.toUpperCase() || 
        c.name.toLowerCase() === portfolio.name.toLowerCase()
      );
      
      if (crypto && portfolio.quantity > 0) {
        const value = portfolio.quantity * crypto.price;
        totalValue += value;
        
        distribution.push({
          name: portfolio.name,
          symbol: portfolio.symbol.toUpperCase(),
          value,
          percentage: 0, // Será calculado depois
          color: colors[index % colors.length]
        });
      }
    });
    
    // Calcular percentagens
    distribution.forEach(asset => {
      asset.percentage = totalValue > 0 ? Math.round((asset.value / totalValue) * 100) : 0;
    });
    
    // Se sobrarem percentagens (devido a arredondamentos), ajustar
    const totalPercentage = distribution.reduce((acc, asset) => acc + asset.percentage, 0);
    if (totalPercentage < 100 && distribution.length > 0) {
      distribution[0].percentage += (100 - totalPercentage);
    }
    
    // Calcular lucro/prejuízo
    const profit = totalValue - totalInvested;
    const profitPercentage = totalInvested > 0 
      ? Math.round((profit / totalInvested) * 100) 
      : 0;
    
    return {
      totalValue,
      profit,
      profitPercentage,
      distribution
    };
  };
  
  const portfolioData = calculatePortfolio();

  const logout = () => {
    Cookies.remove("token");
    Cookies.remove("name");
    router.push("/login");
  };

  // Função para lidar com o envio do formulário de transação
  const handleSubmitTransaction = async () => {
    if (!selectedCrypto || !quantity || !price || !transactionDate) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    if (isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0) {
      toast.error("Por favor, insira uma quantidade válida");
      return;
    }

    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      toast.error("Por favor, insira um preço válido");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Calcular o valor total
      const totalAmount = parseFloat(quantity) * parseFloat(price);
      
      // Obter nome e símbolo da criptomoeda
      const selectedCryptoData = cryptoData.find(
        crypto => crypto.name === selectedCrypto
      );
      
      // Enviar para a API
      await axios.post("/api/transactions", {
        type: transactionType,
        cryptoId: selectedCryptoData?.name.toLowerCase() || selectedCrypto.toLowerCase(),
        symbol: selectedCryptoData?.symbol || "",
        name: selectedCryptoData?.name || selectedCrypto,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        totalAmount,
        date: new Date(transactionDate),
      }, {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`
        }
      });
      
      toast.success("Transação registrada com sucesso!");
      setIsTransactionModalOpen(false);
      
      // Reset form
      setTransactionType("COMPRA");
      setSelectedCrypto("");
      setQuantity("");
      setPrice("");
      setTransactionDate(new Date().toISOString().split("T")[0]);
      
      // Recarregar dados do usuário
      setLoadingPortfolio(true);
      const response = await axios.get('/api/transactions', {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`
        }
      });
      
      const { portfolios } = response.data;
      setPortfolios(portfolios || []);
      
      // Extrair todas as transações em um único array ordenado por data
      const allTransactions = portfolios.flatMap((p: DbPortfolio) => 
        p.transactions.map((t: DbTransaction) => ({
          ...t,
          portfolioName: p.name,
          portfolioSymbol: p.symbol
        }))
      ).sort((a: DbTransaction, b: DbTransaction) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ).slice(0, 4); // Apenas as 4 mais recentes
      
      setTransactions(allTransactions);
      setLoadingPortfolio(false);
      
    } catch (error) {
      console.error("Erro ao registrar transação:", error);
      toast.error("Não foi possível registrar a transação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Limpar formulário quando fechar o modal
  const handleCloseModal = () => {
    setIsTransactionModalOpen(false);
    setTransactionType("COMPRA");
    setSelectedCrypto("");
    setQuantity("");
    setPrice("");
    setTransactionDate(new Date().toISOString().split("T")[0]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header/Navbar */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-blue-600 cursor-pointer" onClick={() => router.push("/app")}>CryptoTrack</div>
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
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button 
            onClick={() => setIsTransactionModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Transação
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-500 text-sm font-normal">Valor Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {portfolioData && portfolioData.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              {loadingPortfolio && (
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Atualizando...
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-500 text-sm font-normal">Lucro/Prejuízo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className={`text-2xl font-bold ${portfolioData && portfolioData.profit > 0 ? 'text-green-600' : portfolioData && portfolioData.profit < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  R$ {portfolioData && portfolioData.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className={`ml-2 px-2 py-1 rounded-full text-xs ${portfolioData && portfolioData.profit > 0 ? 'bg-green-100 text-green-800' : portfolioData && portfolioData.profit < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                  {portfolioData && portfolioData.profit > 0 ? '+' : portfolioData && portfolioData.profit < 0 ? '' : '±'}{portfolioData && portfolioData.profitPercentage}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-500 text-sm font-normal">Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolioData && portfolioData.distribution.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
          <Card className="border border-gray-200 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Cotações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="py-10 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                    <p className="mt-4 text-gray-600">Carregando cotações...</p>
                  </div>
                ) : error ? (
                  <div className="p-4 text-center">
                    <p className="text-red-500">{error}</p>
                    <Button
                      onClick={() => {
                        setLoading(true);
                        setTimeout(() => setLoading(false), 500);
                      }}
                      className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Tentar novamente
                    </Button>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-500 text-sm border-b">
                        <th className="pb-2 font-medium">Nome</th>
                        <th className="pb-2 font-medium">Preço</th>
                        <th className="pb-2 font-medium">24h</th>
                        <th className="pb-2 font-medium hidden sm:block">Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cryptoData.map((crypto, index) => (
                        <tr key={index} className="border-b border-gray-100 text-sm">
                          <td className="py-3 font-medium">
                            {crypto.image && (
                              <Image
                                src={crypto.image}
                                alt={crypto.name}
                                width={20}
                                height={20}
                                className="inline mr-2"
                              />
                            )}
                            {crypto.name} <span className="text-gray-500">{crypto.symbol}</span>
                          </td>
                          <td className="py-3">R$ {crypto.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className={`py-3 ${crypto.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(2)}%
                          </td>
                          <td className="py-3 text-gray-500 hidden sm:block">R$ {crypto.volume}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div className="text-xs text-gray-500 mt-4 text-right">
                  Dados fornecidos por CoinGecko API • Atualizado a cada minuto
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle>Distribuição</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPortfolio ? (
                <div className="py-10 text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="mt-2 text-gray-600 text-sm">Carregando portfólio...</p>
                </div>
              ) : portfolioError ? (
                <div className="p-4 text-center">
                  <p className="text-red-500 text-sm">{portfolioError}</p>
                  <Button 
                    onClick={() => {
                      setLoadingPortfolio(true);
                      setTimeout(() => setLoadingPortfolio(false), 500);
                    }} 
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 h-auto"
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : portfolioData && portfolioData.distribution.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-gray-500 text-sm">Adicione uma nova transação para calcular o percentual do portfólio</p>
                  <Button 
                    onClick={() => setIsTransactionModalOpen(true)} 
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 h-auto"
                  >
                    Adicionar primeira transação
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                      {portfolioData && portfolioData.distribution.map((asset, index) => (
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
                    {portfolioData && portfolioData.distribution.map((asset, index) => (
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
                </>
              )}
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
              {loadingPortfolio ? (
                <div className="py-10 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="mt-4 text-gray-600">Carregando transações...</p>
                </div>
              ) : portfolioError ? (
                <div className="p-4 text-center">
                  <p className="text-red-500">{portfolioError}</p>
                  <Button 
                    onClick={() => {
                      setLoadingPortfolio(true);
                      setTimeout(() => setLoadingPortfolio(false), 500);
                    }} 
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-gray-500">Você ainda não realizou nenhuma transação.</p>
                  <Button 
                    onClick={() => setIsTransactionModalOpen(true)} 
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Adicionar primeira transação
                  </Button>
                </div>
              ) : (
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
                    {transactions.map((tx: FormattedTransaction) => (
                      <tr key={tx.id} className="border-b border-gray-100 text-sm">
                        <td className="py-3">{new Date(tx.date).toLocaleDateString('pt-BR')}</td>
                        <td className={`py-3 font-medium ${tx.type === 'COMPRA' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type}
                        </td>
                        <td className="py-3">{tx.portfolioName} ({tx.portfolioSymbol})</td>
                        <td className="py-3">{tx.quantity}</td>
                        <td className="py-3">R$ {tx.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 font-medium">R$ {tx.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Modal de Transação */}
      <Dialog open={isTransactionModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Transação</DialogTitle>
            <DialogDescription>
              Registre sua compra ou venda de criptomoeda.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transaction-type" className="text-right">
                Tipo
              </Label>
              <Select
                value={transactionType}
                onValueChange={(value) => setTransactionType(value as "COMPRA" | "VENDA")}
              >
                <SelectTrigger className="col-span-3 w-full">
                  <SelectValue placeholder="Tipo de transação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPRA">Compra</SelectItem>
                  <SelectItem value="VENDA">Venda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="crypto" className="text-right">
                Criptomoeda
              </Label>
              <Select 
                value={selectedCrypto} 
                onValueChange={setSelectedCrypto}
                disabled={cryptoData.length === 0}
              >
                <SelectTrigger className="col-span-3 w-full">
                  <SelectValue placeholder="Selecione a criptomoeda" />
                </SelectTrigger>
                <SelectContent>
                  {cryptoData.map((crypto) => (
                    <SelectItem key={crypto.symbol} value={crypto.name}>
                      <div className="flex items-center">
                        {crypto.image && (
                          <Image
                            src={crypto.image}
                            alt={crypto.name}
                            width={16}
                            height={16}
                            className="mr-2"
                          />
                        )}
                        {crypto.name} ({crypto.symbol})
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Outra...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedCrypto === "other" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="custom-crypto" className="text-right">
                  Nome
                </Label>
                <Input
                  id="custom-crypto"
                  placeholder="Nome da criptomoeda"
                  className="col-span-3"
                  onChange={(e) => setSelectedCrypto(e.target.value)}
                />
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantidade
              </Label>
              <Input
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ex: 0.05"
                className="col-span-3"
                type="number"
                step="any"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Preço (R$)
              </Label>
              <Input
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex: 235000"
                className="col-span-3"
                type="number"
                step="any"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Data
              </Label>
              <Input
                id="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="col-span-3"
                type="date"
              />
            </div>
            
            {price && quantity && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Total</Label>
                <div className="col-span-3 font-medium">
                  R$ {(parseFloat(price) * parseFloat(quantity || "0")).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmitTransaction} 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
