import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Esta função pode ser marcada como `async` se estiver usando `await` dentro
export async function middleware(request: NextRequest) {
    // Obter o token do cookie usando a API de cookies do NextRequest
    const token = request.cookies.get("token")?.value;

    if (!token) {
        console.log("Token não encontrado")
        return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || "secret"));

        if (!payload) {
            console.log("Token inválido")
            const response = NextResponse.redirect(new URL('/login', request.url))
            response.cookies.delete("token")
            response.cookies.delete("name")
            return response
        }

        // Verifica se o token está expirado
        const expirationTime = payload.exp as number
        if (expirationTime && Date.now() >= expirationTime * 1000) {
            console.log("Token expirado")
            const response = NextResponse.redirect(new URL('/login', request.url))
            response.cookies.delete("token")
            response.cookies.delete("name")
            return response
        }

        return NextResponse.next()
    } catch (error) {
        console.log("Erro na verificação do token:", error)
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete("token")
        response.cookies.delete("name")
        return response
    }
}

// Configuração dos caminhos que devem passar pelo middleware
export const config = {
    matcher: [
        '/app/:path*',
    ]
}