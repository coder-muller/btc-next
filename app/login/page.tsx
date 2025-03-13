"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import Cookies from "js-cookie";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
    email: z.string().email({ message: "E-mail é obrigatório" }),
    password: z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres" }),
});

export default function AuthPage() {

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    useEffect(() => {
        if (Cookies.get("token")) {
            window.location.href = "/app";
        }
    }, []);

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        try {
            const response = await fetch("/api/auth", {
                method: "POST",
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("Falha ao fazer login");
            }

            const responseData = await response.json();
            Cookies.set("token", responseData.token);
            Cookies.set("name", responseData.name);

            window.location.href = "/app";

        } catch (error) {
            console.error(error);
            toast.error("Falha ao fazer login");
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
            <Link href="/" className="text-2xl font-bold text-blue-600 mb-8">CryptoTrack</Link>
            <Card className="w-full max-w-md border border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Entrar</CardTitle>
                    <CardDescription className="text-center">Faça login para continuar</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>E-mail</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="seu@email.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Senha</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="Sua senha" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="pt-4 flex flex-col items-center gap-4">
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2">Entrar</Button>
                                <Link href="/signup" className="text-sm text-gray-600">Não tem uma conta? <span className="text-blue-600 hover:underline">Cadastre-se</span></Link>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}