export interface PortfolioAsset {
    name: string;
    symbol: string;
    value: number;
    percentage: number;
    color: string;
  }
  
  export interface CryptoData {
    name: string;
    symbol: string;
    price: number;
    change24h: number;
    volume: string;
    image: string;
  }
  
  // Adicionando uma interface para o item da API do CoinGecko
  export interface CoinGeckoItem {
    id: string;
    name: string;
    symbol: string;
    current_price: number;
    price_change_percentage_24h: number;
    total_volume: number;
    image: string;
  }
  
  // Interface para as transações reais do banco de dados
  export interface DbTransaction {
    id: string;
    portfolioId: string;
    type: "COMPRA" | "VENDA";
    quantity: number;
    price: number;
    totalAmount: number;
    date: string;
  }
  
  // Interface para transações formatadas para exibição
  export interface FormattedTransaction extends DbTransaction {
    portfolioName: string;
    portfolioSymbol: string;
  }
  
  export interface DbPortfolio {
    id: string;
    userId: string;
    name: string;
    symbol: string;
    quantity: number;
    transactions: DbTransaction[];
  }