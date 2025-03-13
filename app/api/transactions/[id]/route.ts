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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

  const { id } = params;
  const { type, quantity, totalAmount, date } = await request.json();

  try {
    // Verificar se a transação pertence ao usuário
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { portfolio: true }
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
    }

    if (transaction.portfolio.userId !== userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Atualizar a transação
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: { 
        type, 
        quantity, 
        totalAmount, 
        date: new Date(date) 
      }
    });

    return NextResponse.json({ 
      message: 'Transação atualizada com sucesso', 
      transaction: updatedTransaction 
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    return NextResponse.json({ error: 'Erro ao atualizar transação' }, { status: 500 });
  }
} 