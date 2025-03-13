import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose'

// Esta função pode ser marcada como `async` se estiver usando `await` dentro
export async function middleware(request: NextRequest) {
    // Obter o token do cookie usando a API de cookies do NextRequest
    const token = request.cookies.get("token")?.value;

    if (!token) {
        console.log("Token não encontrado")
        return NextResponse.redirect(new URL('/auth', request.url))
    }

    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || "secret"));

        if (!payload) {
            console.log("Token inválido")
            return NextResponse.redirect(new URL('/auth', request.url))
        }

        return NextResponse.next()
    } catch (error) {
        console.log("Erro na verificação do token:", error)
        return NextResponse.redirect(new URL('/auth', request.url))
    }
}

// Configuração dos caminhos que devem passar pelo middleware
export const config = {
    matcher: [
        '/app/:path*',
    ]
}