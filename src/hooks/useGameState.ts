import { useState, useEffect, useCallback } from 'react';
import { GameState, ScratchCard, ScratchBlock } from '../types';

const GAME_STATE_KEY = 'raspadinha_game_state';
const CARD_COST = 4.90;

const getWinLogic = (roundNumber: number) => {
  if (roundNumber === 3) return { shouldWin: true, prizeAmount: 30.00, prizeType: 'money' };
  if (roundNumber === 7) return { shouldWin: true, prizeAmount: 20.00, prizeType: 'money' };
  if (roundNumber === 12) return { shouldWin: true, prizeAmount: 0, prizeType: 'applewatch' };
  return { shouldWin: false, prizeAmount: 0, prizeType: 'money' };
};

const generateWinningCard = (prizeAmount: number, prizeType: 'money' | 'applewatch'): ScratchCard => {
  const grid: ScratchBlock[] = [];
  const winningSymbol = prizeType === 'applewatch' ? '/Apple-Watch-PNG-High-Quality-Image.png' : '💰';

  const moneySymbols = ['💵', '💰', '💸', '🪙', '🤑'];
  const appleImages = [
    '/iphone_11_PNG20.png',
    '/pngimg.com - iphone_14_PNG41.png',
    '/Apple-iPhone-15-Pro-Max-Blue-Titanium-frontimage.webp',
    '/Airpods-Transparent-Images-PNG.png',
    '/Apple-Watch-PNG-High-Quality-Image.png'
  ];
  const allSymbols = [...moneySymbols, ...appleImages];

  for (let i = 0; i < 9; i++) {
    const isWinningPosition = i >= 3 && i <= 5;
    grid.push({
      id: i,
      isRevealed: false,
      symbol: isWinningPosition ? winningSymbol : allSymbols[Math.floor(Math.random() * allSymbols.length)],
      position: { x: i % 3, y: Math.floor(i / 3) }
    });
  }

  return {
    id: `card_${Date.now()}`,
    cost: CARD_COST,
    grid,
    isCompleted: false,
    hasWon: true,
    prizeAmount: prizeType === 'applewatch' ? 2499 : prizeAmount,
    prizeType,
  };
};

const generateLosingCard = (): ScratchCard => {
  const moneySymbols = ['💵', '💰', '💸', '🪙', '🤑'];
  const appleImages = [
    '/iphone_11_PNG20.png',
    '/iphone_13_PNG31.png',
    '/pngimg.com - iphone_14_PNG41.png',
    '/Apple-iPhone-15-Pro-Max-Blue-Titanium-frontimage.webp',
    '/Airpods-Transparent-Images-PNG.png',
    '/Apple-Watch-PNG-High-Quality-Image.png'
  ];
  const allSymbols = [...moneySymbols, ...appleImages];
  const grid: ScratchBlock[] = [];

  const wouldCreateWinningPattern = (currentGrid: ScratchBlock[], pos: number, sym: string): boolean => {
    const temp = [...currentGrid];
    temp[pos] = { id: pos, isRevealed: false, symbol: sym, position: { x: pos % 3, y: Math.floor(pos / 3) } };
    const patterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    return patterns.some(pattern => {
      const symbols = pattern.map(i => temp[i]?.symbol).filter(Boolean);
      return symbols.length === 3 && symbols.every(s => s === symbols[0]);
    });
  };

  for (let i = 0; i < 9; i++) {
    let symbol;
    let attempts = 0;
    do {
      symbol = Math.random() < 0.8
        ? moneySymbols[Math.floor(Math.random() * moneySymbols.length)]
        : appleImages[Math.floor(Math.random() * appleImages.length)];
      attempts++;
    } while (wouldCreateWinningPattern(grid, i, symbol) && attempts < 50);

    grid.push({
      id: i,
      isRevealed: false,
      symbol,
      position: { x: i % 3, y: Math.floor(i / 3) }
    });
  }

  return {
    id: `card_${Date.now()}`,
    cost: CARD_COST,
    grid,
    isCompleted: false,
    hasWon: false,
  };
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    balance: 0,
    scratchCardsUsed: 0,
    hasWonIphone: false,
    kycStatus: {
      isVerified: false,
      identityVerified: false,
      depositVerified: false
    }
  });

  const [isNewUser, setIsNewUser] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(GAME_STATE_KEY);
    if (saved) {
      const parsedState = JSON.parse(saved);
      console.log('📊 Estado carregado:', parsedState);
      setGameState(parsedState);
      setIsNewUser(false);
    } else {
      console.log('🆕 Novo usuário');
    }
  }, []);

  const saveGameState = useCallback((newState: GameState) => {
    console.log('💾 Salvando:', newState);
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(newState));
    setGameState(newState);
  }, []);

  const startNewCard = useCallback((): ScratchCard | null => {
    console.log('=== INICIANDO NOVA CARTA ===');
    console.log('Saldo atual:', gameState.balance);
    console.log('Custo:', CARD_COST);
    console.log('Rodadas jogadas:', gameState.scratchCardsUsed);

    if (gameState.balance < CARD_COST) {
      console.log('❌ SALDO INSUFICIENTE!');
      return null;
    }

    const newRound = gameState.scratchCardsUsed + 1;
    console.log('🎮 RODADA:', newRound);

    const winLogic = getWinLogic(newRound);
    console.log('Lógica:', winLogic);

    const card = winLogic.shouldWin
      ? generateWinningCard(winLogic.prizeAmount, winLogic.prizeType as 'money' | 'applewatch')
      : generateLosingCard();

    const newBalance = parseFloat((gameState.balance - CARD_COST).toFixed(2));
    const newState: GameState = {
      ...gameState,
      balance: newBalance,
      scratchCardsUsed: newRound
    };

    console.log('Novo estado:', newState);
    saveGameState(newState);
    return card;
  }, [gameState, saveGameState]);

  const completeCard = useCallback((card: ScratchCard) => {
    console.log('=== COMPLETANDO CARTA ===');
    console.log('Ganhou?', card.hasWon);

    if (!card.hasWon) {
      console.log('😢 Perdeu');
      return;
    }

    let newState = { ...gameState };

    if (card.prizeType === 'applewatch') {
      console.log('🎁 GANHOU APPLE WATCH!');
      newState.hasWonIphone = true;
    } else if (card.prizeAmount && card.prizeAmount > 0) {
      console.log('💰 Ganhou R$', card.prizeAmount);
      newState.balance = parseFloat((gameState.balance + card.prizeAmount).toFixed(2));
    }

    console.log('Novo estado:', newState);
    saveGameState(newState);
  }, [gameState, saveGameState]);

  const addBalance = useCallback((amount: number) => {
    console.log('💵 Adicionando R$', amount);
    const newBalance = parseFloat((gameState.balance + amount).toFixed(2));
    const newState: GameState = {
      ...gameState,
      balance: newBalance
    };

    if (newState.kycStatus && !newState.kycStatus.depositVerified && amount > 0) {
      newState.kycStatus = {
        ...newState.kycStatus,
        depositVerified: true,
        isVerified: newState.kycStatus.identityVerified && true
      };
      console.log('✅ Depósito verificado! KYC concluído:', newState.kycStatus.isVerified);
    }

    console.log('Novo saldo:', newBalance);
    saveGameState(newState);
  }, [gameState, saveGameState]);

  const updateKYCStatus = useCallback((kycStatus: GameState['kycStatus']) => {
    console.log('🔐 Atualizando KYC:', kycStatus);
    const newState: GameState = {
      ...gameState,
      kycStatus
    };
    saveGameState(newState);
  }, [gameState, saveGameState]);

  return {
    gameState,
    isNewUser,
    startNewCard,
    completeCard,
    addBalance,
    updateKYCStatus
  };
};
