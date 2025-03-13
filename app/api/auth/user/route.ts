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

// GET - Obter dados do usuário
export async function GET(request: NextRequest) {
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
    // Buscar dados do usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true, // Assumindo que existe um campo plan no modelo User
        createdAt: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados do usuário' }, { status: 500 });
  }
}

// PUT - Atualizar dados do usuário
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
    const { name, email } = await request.json();

    // Verificar se os campos obrigatórios foram fornecidos
    if (!name || !email) {
      return NextResponse.json({ error: 'Nome e email são obrigatórios' }, { status: 400 });
    }

    // Verificar se o email já está em uso por outro usuário
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId },
        },
      });

      if (existingUser) {
        return NextResponse.json({ error: 'Este email já está em uso por outro usuário' }, { status: 400 });
      }
    }

    // Atualizar dados do usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
      }
    });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar dados do usuário:', error);
    return NextResponse.json({ error: 'Erro ao atualizar dados do usuário' }, { status: 500 });
  }
} 