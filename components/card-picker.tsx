import { Text, View, Pressable, Modal } from "react-native";
import React from "react";
import type { Deck, Suit, Card, Rank } from "@/libs/poker";
import { useState, useMemo } from "react";

export default function CardPicker({ deck, onCardPicked }: { deck: Deck, onCardPicked: (card: Card) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSuit, setSelectedSuit] = useState<Suit | null>(null);

  // Get available suits and ranks from remaining deck
  const availableCards = useMemo(() => {
    const suits = new Set(deck.map(card => card.suit));
    const ranksBySuit = deck.reduce((acc, card) => {
      if (!acc[card.suit]) acc[card.suit] = new Set<Rank>();
      acc[card.suit].add(card.rank);
      return acc;
    }, {} as Record<Suit, Set<Rank>>);
    return { suits, ranksBySuit };
  }, [deck]);

  const allSuits: Suit[] = ['h', 'd', 'c', 's'];
  const allRanks: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

  const handleSuitSelect = (suit: Suit) => {
    if (availableCards.suits.has(suit)) {
      setSelectedSuit(suit);
    }
  };

  const handleRankSelect = (rank: Rank) => {
    if (selectedSuit && availableCards.ranksBySuit[selectedSuit].has(rank)) {
      onCardPicked({ suit: selectedSuit, rank });
      setIsOpen(false);
    }
  };

  const getSuitColor = (suit: Suit) => {
    switch (suit) {
      case 'h': return 'text-red-500';
      case 'd': return 'text-blue-500';
      case 'c': return 'text-green-600';
      case 's': return 'text-black';
    }
  };

  return (
    <>
      <Pressable
        className="w-20 h-28 bg-white border-2 border-gray-300 rounded-xl shadow-md justify-center items-center"
        onPress={() => {
          setSelectedSuit(null);
          setIsOpen(true);
        }}
      >
        <Text className="text-4xl">🎴</Text>
      </Pressable>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setSelectedSuit(null);
          setIsOpen(false);
        }}
      >
        <Pressable
          className="flex-1 justify-center items-center bg-black/50"
          onPress={() => {
            setSelectedSuit(null);
            setIsOpen(false);
          }}
        >
          <Pressable
            onPress={() => { /* stop propagation */ }}
            className="bg-white p-4 rounded-lg w-64"
          >
            {!selectedSuit ? (
              <View className="gap-2">
                <Text className="text-center font-bold mb-2">Select a Suit</Text>
                <View className="flex-row flex-wrap justify-center gap-2">
                  {allSuits.map((suit) => (
                    <Pressable
                      key={suit}
                      className={`w-24 h-24 justify-center items-center rounded-lg ${availableCards.suits.has(suit) ? 'bg-gray-100' : 'bg-gray-200'}`}
                      onPress={() => handleSuitSelect(suit)}
                    >
                      <Text className={`text-4xl ${getSuitColor(suit)} ${!availableCards.suits.has(suit) && 'opacity-30'}`}>
                        {{ h: '♥', d: '♦', c: '♣', s: '♠' }[suit]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              <View className="gap-2">
                <Text className="text-center font-bold mb-2">Select a Rank</Text>
                <View className="flex-row flex-wrap justify-center gap-2">
                  {allRanks.map((rank) => (
                    <Pressable
                      key={rank}
                      className={`w-12 h-12 justify-center items-center rounded-lg ${availableCards.ranksBySuit[selectedSuit].has(rank) ? 'bg-gray-100' : 'bg-gray-200'}`}
                      onPress={() => handleRankSelect(rank)}
                    >
                      <Text className={`text-lg ${!availableCards.ranksBySuit[selectedSuit].has(rank) && 'opacity-30'}`}>
                        {({ 11: 'J', 12: 'Q', 13: 'K', 14: 'A' } as Record<number, string>)[rank] || rank}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}