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

export async function POST(request: NextRequest) {
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
    const body = await request.json();

    // Validar dados da transação
    const { type, cryptoId, symbol, name, quantity, price, totalAmount, date } = body;

    if (!type || !cryptoId || !quantity || !price || !totalAmount) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Buscar ou criar o portfólio para essa criptomoeda
    let portfolio = await prisma.portfolio.findUnique({
      where: {
        userId_cryptoId: {
          userId,
          cryptoId,
        }
      }
    });

    // Calcular a nova quantidade baseada no tipo de transação
    const quantityChange = type === 'COMPRA' ? quantity : -quantity;
    
    if (!portfolio) {
      // Se não existir um portfólio, criamos um novo (apenas para compras)
      if (type === 'VENDA') {
        return NextResponse.json(
          { error: 'Não é possível vender um ativo que você não possui' },
          { status: 400 }
        );
      }

      portfolio = await prisma.portfolio.create({
        data: {
          userId,
          cryptoId,
          symbol: symbol || '',
          name: name || cryptoId,
          quantity,
        }
      });
    } else {
      // Atualizar quantidade no portfólio existente
      const newQuantity = portfolio.quantity + quantityChange;
      
      // Verificar se há quantidade suficiente para venda
      if (newQuantity < 0) {
        return NextResponse.json(
          { error: 'Quantidade insuficiente para venda' },
          { status: 400 }
        );
      }
      
      await prisma.portfolio.update({
        where: { id: portfolio.id },
        data: { quantity: newQuantity }
      });
    }

    // Registrar a transação
    const transaction = await prisma.transaction.create({
      data: {
        portfolioId: portfolio.id,
        type: type === 'COMPRA' ? 'COMPRA' : 'VENDA',
        quantity,
        price,
        totalAmount,
        date: new Date(date || Date.now()),
      }
    });

    return NextResponse.json({ 
      message: 'Transação registrada com sucesso',
      transaction,
      portfolio: {
        id: portfolio.id,
        cryptoId: portfolio.cryptoId,
        symbol: portfolio.symbol,
        name: portfolio.name,
        quantity: portfolio.quantity
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao processar transação:', error);
    return NextResponse.json({ error: 'Erro ao processar transação' }, { status: 500 });
  }
}

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
    // Buscar todas as carteiras do usuário com suas transações
    const portfolios = await prisma.portfolio.findMany({
      where: { userId },
      include: {
        transactions: {
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    return NextResponse.json({ portfolios }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return NextResponse.json({ error: 'Erro ao buscar transações' }, { status: 500 });
  }
} 