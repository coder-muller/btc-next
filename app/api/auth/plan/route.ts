import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Função para verificar o token JWT
async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET || "secret")
    );

    // Aceitar tanto payload.userId quanto payload.id
    const userId = payload.userId || payload.id;

    if (!userId) {
      console.error('Token sem userId ou id válido:', payload);
      return null;
    }

    return userId as string;
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return null;
  }
}

// PUT - Atualizar plano do usuário
export async function PUT(request: NextRequest) {
  // Verificar autenticação
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const userId = await verifyToken(token);

  if (!userId) {
    return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
  }

  try {
    const { plan } = await request.json();

    // Verificar se o plano é válido
    if (!plan || (plan !== 'FREE' && plan !== 'PRO')) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
    }

    // Buscar usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Atualizar plano do usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        plan,
      },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
      }
    });

    return NextResponse.json({ 
      message: `Plano atualizado para ${plan} com sucesso`,
      user: updatedUser 
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    return NextResponse.json({ error: 'Erro ao atualizar plano' }, { status: 500 });
  }
} 