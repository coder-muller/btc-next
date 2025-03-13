"use client";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Cookies from "js-cookie";
import { ArrowDown, ArrowUp, Calendar, Edit, Trash } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { CoinGeckoItem, CryptoData, DbPortfolio, FormattedTransaction } from "../../types";

// Schema para validação do formulário de edição
const transactionFormSchema = z.object({
    type: z.enum(["COMPRA", "VENDA"]),
    quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Quantidade deve ser um número positivo",
    }),
    price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Preço deve ser um número positivo",
    }),
    date: z.date(),
});

export default function TransactionsPage() {
    const [userName, setUserName] = useState("");
    const router = useRouter();
    const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<FormattedTransaction[]>([]);

    // Estados para filtros e ordenação
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [selectedAsset, setSelectedAsset] = useState<string>("all");
    const [selectedType, setSelectedType] = useState<string>("all");

    // Estados para edição
    const [editingTransaction, setEditingTransaction] = useState<FormattedTransaction | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<FormattedTransaction | null>(null);

    // Formulário de edição
    const form = useForm<z.infer<typeof transactionFormSchema>>({
        resolver: zodResolver(transactionFormSchema),
        defaultValues: {
            type: "COMPRA",
            quantity: "",
            price: "",
            date: new Date(),
        },
    });

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
    }, []);

    // Buscar transações
    useEffect(() => {
        const fetchTransactions = async () => {
            const token = Cookies.get("token");
            if (!token) return;

            try {
                setLoading(true);
                const response = await axios.get('/api/transactions', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                // Formatar transações com nome e símbolo do portfólio
                const formattedTransactions: FormattedTransaction[] = response.data.portfolios
                    .flatMap((portfolio: DbPortfolio) =>
                        portfolio.transactions.map(tx => ({
                            ...tx,
                            portfolioName: portfolio.name,
                            portfolioSymbol: portfolio.symbol
                        }))
                    )
                    .sort((a: FormattedTransaction, b: FormattedTransaction) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );

                setTransactions(formattedTransactions);
                setError(null);
            } catch (err) {
                console.error('Erro ao buscar transações:', err);
                setError('Não foi possível carregar suas transações');
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    // Filtrar e ordenar transações
    const filteredTransactions = transactions
        .filter(tx => {
            // Filtrar por data
            if (dateRange?.from) {
                const txDate = new Date(tx.date);
                if (dateRange.to) {
                    if (txDate < dateRange.from || txDate > dateRange.to) return false;
                } else {
                    if (txDate < dateRange.from) return false;
                }
            }

            // Filtrar por ativo
            if (selectedAsset !== "all" && tx.portfolioSymbol.toLowerCase() !== selectedAsset.toLowerCase()) {
                return false;
            }

            // Filtrar por tipo
            if (selectedType !== "all" && tx.type !== selectedType) {
                return false;
            }

            return true;
        })
        .sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
        });

    // Funções de edição e exclusão
    const handleEdit = (transaction: FormattedTransaction) => {
        setEditingTransaction(transaction);
        form.reset({
            type: transaction.type,
            quantity: transaction.quantity.toString(),
            price: (transaction.totalAmount / transaction.quantity).toString(),
            date: new Date(transaction.date),
        });
        setIsEditDialogOpen(true);
    };

    const handleDelete = (transaction: FormattedTransaction) => {
        setTransactionToDelete(transaction);
        setIsDeleteDialogOpen(true);
    };

    const onSubmitEdit = async (values: z.infer<typeof transactionFormSchema>) => {
        if (!editingTransaction) return;

        const token = Cookies.get("token");
        if (!token) return;

        try {
            const totalAmount = Number(values.quantity) * Number(values.price);

            await axios.put(
                `/api/transactions/${editingTransaction.id}`,
                {
                    type: values.type,
                    quantity: Number(values.quantity),
                    totalAmount,
                    date: values.date.toISOString(),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Atualizar lista de transações
            const updatedTransactions = transactions.map(tx =>
                tx.id === editingTransaction.id
                    ? {
                        ...tx,
                        type: values.type,
                        quantity: Number(values.quantity),
                        totalAmount,
                        date: values.date.toISOString(),
                    }
                    : tx
            );

            setTransactions(updatedTransactions);
            setIsEditDialogOpen(false);
            toast.success("Transação atualizada com sucesso!");
        } catch (err) {
            console.error('Erro ao atualizar transação:', err);
            toast.error("Erro ao atualizar transação");
        }
    };

    const confirmDelete = async () => {
        if (!transactionToDelete) return;

        const token = Cookies.get("token");
        if (!token) return;

        try {
            await axios.delete(`/api/transactions/${transactionToDelete.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Remover transação da lista
            setTransactions(transactions.filter(tx => tx.id !== transactionToDelete.id));
            setIsDeleteDialogOpen(false);
            toast.success("Transação excluída com sucesso!");
        } catch (err) {
            console.error('Erro ao excluir transação:', err);
            toast.error("Erro ao excluir transação");
        }
    };

    const logout = () => {
        Cookies.remove("token");
        Cookies.remove("name");
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            {/* Header/Navbar */}
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-2xl font-bold text-blue-600 cursor-pointer" onClick={() => router.push("/app")}>
                            CryptoTrack
                        </div>
                        <nav className="flex flex-wrap justify-center gap-4 sm:gap-8">
                            <Link href="/app" className="text-gray-600 hover:text-blue-600 transition-colors">
                                Dashboard
                            </Link>
                            <Link href="/app/portfolio" className="text-gray-600 hover:text-blue-600 transition-colors">
                                Portfólio
                            </Link>
                            <Link href="/app/transactions" className="text-blue-600 font-medium">
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
            <main className="container mx-auto px-4 sm:px-6 py-8">
                <div className="flex flex-col gap-6">
                    {/* Título e Filtros */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h1 className="text-2xl font-bold">Histórico de Transações</h1>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Filtro de Data */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
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
                                            "Filtrar por data"
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

                            {/* Filtro de Ativo */}
                            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                                <SelectTrigger className="w-full">
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

                            {/* Filtro de Tipo */}
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Filtrar por tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os tipos</SelectItem>
                                    <SelectItem value="COMPRA">Compra</SelectItem>
                                    <SelectItem value="VENDA">Venda</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Ordem (Asc/Desc) */}
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                            >
                                {sortOrder === "desc" ? (
                                    <ArrowDown className="mr-2 h-4 w-4" />
                                ) : (
                                    <ArrowUp className="mr-2 h-4 w-4" />
                                )}
                                Ordenar por data
                            </Button>
                        </div>
                    </div>

                    {/* Lista de Transações */}
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                                <p className="text-gray-600">Carregando transações...</p>
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
                    ) : filteredTransactions.length === 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Nenhuma transação encontrada</CardTitle>
                                <CardDescription>
                                    Não existem transações para os filtros selecionados.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {filteredTransactions.map((transaction) => (
                                <Card key={transaction.id}>
                                    <CardContent className="p-6">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div className="flex items-center gap-4">
                                                {cryptoData.find(c => c.symbol === transaction.portfolioSymbol)?.image && (
                                                    <Image
                                                        src={cryptoData.find(c => c.symbol === transaction.portfolioSymbol)?.image || ""}
                                                        alt={transaction.portfolioName}
                                                        width={40}
                                                        height={40}
                                                        className="rounded-full"
                                                    />
                                                )}
                                                <div>
                                                    <h3 className="font-medium">
                                                        {transaction.portfolioName} ({transaction.portfolioSymbol})
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        {format(new Date(transaction.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                                <div className="flex flex-col items-start sm:items-end">
                                                    <span className={`font-medium ${transaction.type === "COMPRA" ? "text-green-600" : "text-red-600"
                                                        }`}>
                                                        {transaction.type === "COMPRA" ? "Compra" : "Venda"}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {transaction.quantity.toFixed(8)} unidades
                                                    </span>
                                                </div>

                                                <div className="flex flex-col items-start sm:items-end">
                                                    <span className="font-medium">
                                                        R$ {transaction.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        R$ {(transaction.totalAmount / transaction.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / un
                                                    </span>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => handleEdit(transaction)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="text-red-600 hover:text-red-700"
                                                        onClick={() => handleDelete(transaction)}
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Modal de Edição */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Transação</DialogTitle>
                        <DialogDescription>
                            Altere os detalhes da transação abaixo.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo</FormLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="COMPRA">Compra</SelectItem>
                                                <SelectItem value="VENDA">Venda</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantidade</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="number" step="any" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Preço por unidade (R$)</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="number" step="any" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-gray-500"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                                        ) : (
                                                            "Selecione uma data"
                                                        )}
                                                        <Calendar className="ml-auto h-4 w-4" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                    locale={ptBR}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditDialogOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit">Salvar alterações</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Modal de Confirmação de Exclusão */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Exclusão</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                        >
                            Excluir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
