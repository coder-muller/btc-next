import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
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

// PUT - Atualizar senha do usuário
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
    const { currentPassword, newPassword } = await request.json();

    // Verificar se os campos obrigatórios foram fornecidos
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Senha atual e nova senha são obrigatórias' }, { status: 400 });
    }

    // Buscar usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se a senha atual está correta
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 });
    }

    // Gerar hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha do usuário
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({ message: 'Senha atualizada com sucesso' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return NextResponse.json({ error: 'Erro ao atualizar senha' }, { status: 500 });
  }
} 