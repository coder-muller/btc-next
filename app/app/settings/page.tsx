"use client";

import { Button } from "@/components/ui/button";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { TxPlan } from '@prisma/client';
import axios from "axios";
import Cookies from "js-cookie";
import { Check, CreditCard, KeyRound, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

// Schema para validação do formulário de dados pessoais
const personalDataSchema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    email: z.string().email("Email inválido"),
});

// Schema para validação do formulário de senha
const passwordSchema = z.object({
    currentPassword: z.string().min(6, "Senha atual deve ter pelo menos 6 caracteres"),
    newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirmação de senha deve ter pelo menos 6 caracteres"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
});

export default function SettingsPage() {
    const [userName, setUserName] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [userPlan, setUserPlan] = useState<TxPlan>("FREE");
    const [loading, setLoading] = useState(true);
    const [isChangingPlan, setIsChangingPlan] = useState(false);
    const router = useRouter();

    // Formulário de dados pessoais
    const personalDataForm = useForm<z.infer<typeof personalDataSchema>>({
        resolver: zodResolver(personalDataSchema),
        defaultValues: {
            name: "",
            email: "",
        },
    });

    // Formulário de senha
    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    // Verificar autenticação e carregar dados do usuário
    useEffect(() => {
        const token = Cookies.get("token");
        if (!token) {
            router.push("/login");
            return;
        }

        const fetchUserData = async () => {
            try {
                const response = await axios.get("/api/auth/user", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data && response.data.user) {
                    const { name, email, plan = "FREE" } = response.data.user;
                    setUserName(name || "");
                    setUserEmail(email || "");
                    setUserPlan(plan as TxPlan);

                    personalDataForm.reset({
                        name: name || "",
                        email: email || "",
                    });
                } else {
                    const name = Cookies.get("name");
                    setUserName(name || "");
                    
                    personalDataForm.reset({
                        name: name || "",
                        email: "",
                    });
                    
                    console.warn("Dados de usuário incompletos na resposta da API");
                }
            } catch (error) {
                console.error("Erro ao carregar dados do usuário:", error);
                
                const name = Cookies.get("name");
                setUserName(name || "");
                
                personalDataForm.reset({
                    name: name || "",
                    email: "",
                });
                
                toast.error("Erro ao carregar seus dados");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [router, personalDataForm]);

    // Atualizar dados pessoais
    const onSubmitPersonalData = async (values: z.infer<typeof personalDataSchema>) => {
        const token = Cookies.get("token");
        if (!token) return;

        try {
            await axios.put("/api/auth/user", values, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setUserName(values.name);
            setUserEmail(values.email);
            Cookies.set("name", values.name);
            toast.success("Dados atualizados com sucesso!");
        } catch (error) {
            console.error("Erro ao atualizar dados:", error);
            toast.error("Erro ao atualizar seus dados");
        }
    };

    // Atualizar senha
    const onSubmitPassword = async (values: z.infer<typeof passwordSchema>) => {
        const token = Cookies.get("token");
        if (!token) return;

        try {
            await axios.put("/api/auth/password", {
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            passwordForm.reset();
            toast.success("Senha atualizada com sucesso!");
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                toast.error(error.response.data.error);
            } else {
                console.error("Erro ao atualizar senha:", error);
                toast.error("Erro ao atualizar senha");
            }
        }
    };

    // Alterar plano
    const handlePlanChange = async () => {
        const token = Cookies.get("token");
        if (!token) return;

        try {
            await axios.put("/api/auth/plan", {
                plan: userPlan === "FREE" ? "PRO" : "FREE"
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setUserPlan(userPlan === "FREE" ? "PRO" : "FREE");
            setIsChangingPlan(false);
            toast.success(`Plano alterado para ${userPlan === "FREE" ? "PRO" : "FREE"} com sucesso!`);
        } catch (error) {
            console.error("Erro ao alterar plano:", error);
            toast.error("Erro ao alterar plano");
        }
    };

    const logout = () => {
        Cookies.remove("token");
        Cookies.remove("name");
        router.push("/login");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                    <p className="text-gray-600">Carregando configurações...</p>
                </div>
            </div>
        );
    }

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
                            <Link href="/app/transactions" className="text-gray-600 hover:text-blue-600 transition-colors">
                                Transações
                            </Link>
                            <Link href="/app/settings" className="text-blue-600 font-medium">
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
                <div className="max-w-4xl mx-auto space-y-6">
                    <h1 className="text-2xl font-bold mb-6">Configurações da Conta</h1>

                    {/* Dados Pessoais */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Dados Pessoais
                            </CardTitle>
                            <CardDescription>
                                Atualize suas informações pessoais
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 text-sm text-gray-600">
                                Email atual: <span className="font-medium">{userEmail}</span>
                            </div>
                            <Form {...personalDataForm}>
                                <form onSubmit={personalDataForm.handleSubmit(onSubmitPersonalData)} className="space-y-4">
                                    <FormField
                                        control={personalDataForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={personalDataForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="email" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button type="submit">Salvar alterações</Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    {/* Alterar Senha */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <KeyRound className="h-5 w-5" />
                                Alterar Senha
                            </CardTitle>
                            <CardDescription>
                                Atualize sua senha de acesso
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...passwordForm}>
                                <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
                                    <FormField
                                        control={passwordForm.control}
                                        name="currentPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Senha atual</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="password" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={passwordForm.control}
                                        name="newPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nova senha</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="password" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={passwordForm.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Confirmar nova senha</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="password" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button type="submit">Alterar senha</Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    {/* Plano */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Seu Plano
                            </CardTitle>
                            <CardDescription>
                                Gerencie seu plano de assinatura
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium">Plano Atual: {userPlan}</h3>
                                        <p className="text-sm text-gray-500">
                                            {userPlan === "FREE" ? (
                                                "Plano gratuito com recursos básicos"
                                            ) : (
                                                "Plano premium com recursos avançados"
                                            )}
                                        </p>
                                    </div>
                                    <Button
                                        variant={userPlan === "FREE" ? "default" : "outline"}
                                        onClick={() => setIsChangingPlan(true)}
                                    >
                                        {userPlan === "FREE" ? "Upgrade para PRO" : "Voltar para FREE"}
                                    </Button>
                                </div>

                                {userPlan === "FREE" && (
                                    <div className="border rounded-lg p-4 bg-gray-50">
                                        <h4 className="font-medium mb-2">Benefícios do Plano PRO:</h4>
                                        <ul className="space-y-2">
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-600" />
                                                Análises avançadas de portfólio
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-600" />
                                                Alertas de preço personalizados
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-600" />
                                                Relatórios detalhados de performance
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-600" />
                                                Suporte prioritário
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Modal de Confirmação de Mudança de Plano */}
            <Dialog open={isChangingPlan} onOpenChange={setIsChangingPlan}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Alteração de Plano</DialogTitle>
                        <DialogDescription>
                            {userPlan === "FREE" ? (
                                "Você está prestes a fazer upgrade para o plano PRO. Deseja continuar?"
                            ) : (
                                "Você está prestes a voltar para o plano FREE. Alguns recursos serão desativados. Deseja continuar?"
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsChangingPlan(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant={userPlan === "FREE" ? "default" : "destructive"}
                            onClick={handlePlanChange}
                        >
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
