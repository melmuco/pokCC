import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const baseSetCards = [
    { name: 'Blastoise', number: '2', rarity: 'Rare', supertype: 'Pokémon', types: ['Water'], hp: 130, artist: 'Mina Ogawa', setImageId: 1, tcgplayerId: 'BLM-2' },
    { name: 'Charizard', number: '4', rarity: 'Rare Holo', supertype: 'Pokémon', types: ['Fire', 'Flying'], hp: 120, artist: 'Mitsuhiko Aida', setImageId: 1, tcgplayerId: 'BLM-4' },
    { name: 'Venusaur', number: '3', rarity: 'Rare Holo', supertype: 'Pokémon', types: ['Grass', 'Poison'], hp: 130, artist: 'Mitsuhiro Aida', setImageId: 1, tcgplayerId: 'BLM-3' },
    { name: 'Alakazam', number: '6', rarity: 'Rare Holo', supertype: 'Pokémon', types: ['Psychic'], hp: 110, artist: 'Masudera', setImageId: 1, tcgplayerId: 'BLM-6' },
    { name: 'Gengar', number: '8', rarity: 'Rare Holo', supertype: 'Pokémon', types: ['Ghost', 'Psychic'], hp: 110, artist: 'Miki', setImageId: 1, tcgplayerId: 'BLM-8' },
    { name: 'Dragonite', number: '12', rarity: 'Rare Holo', supertype: 'Pokémon', types: ['Dragon', ' Fighting'], hp: 130, artist: 'Mitsuhiko Aida', setImageId: 1, tcgplayerId: 'BLM-12' },
    { name: 'Machamp', number: '11', rarity: 'Rare', supertype: 'Pokémon', types: ['Fighting'], hp: 140, artist: 'Masuda', setImageId: 1, tcgplayerId: 'BLM-11' },
    { name: 'Aerodactyl', number: '10', rarity: 'Rare Holo', supertype: 'Pokémon', types: ['Rock', 'Flying'], hp: 105, artist: 'Sanao Mizoguchi', setImageId: 1, tcgplayerId: 'BLM-10' },
    { name: 'Chansey', number: '14', rarity: 'Uncommon', supertype: 'Pokémon', types: ['Normal'], hp: 90, artist: 'Yoji Shinkawa', setImageId: 1, tcgplayerId: 'BLM-14' },
    { name: 'Tangela', number: '15', rarity: 'Uncommon', supertype: 'Pokémon', types: ['Grass'], hp: 65, artist: 'Keita Nakagawa', setImageId: 1, tcgplayerId: 'BLM-15' },
    { name: 'Dodrio', number: '16', rarity: 'Uncommon', supertype: 'Pokémon', types: ['Normal'], hp: 95, artist: 'Masayaki Kobayashi', setImageId: 1, tcgplayerId: 'BLM-16' },
    { name: 'Hitmonlee', number: '17', rarity: 'Uncommon', supertype: 'Pokémon', types: ['Fighting'], hp: 95, artist: 'Morihiko Iwata', setImageId: 1, tcgplayerId: 'BLM-17' },
    { name: 'Staryu', number: '18', rarity: 'Uncommon', supertype: 'Pokémon', types: ['Water'], hp: 60, artist: 'Yuji Ohgi', setImageId: 1, tcgplayerId: 'BLM-18' },
    { name: 'Starmie', number: '20', rarity: 'Rare', supertype: 'Pokémon', types: ['Water', 'Psychic'], hp: 90, artist: 'Mitsuhiko Aida', setImageId: 1, tcgplayerId: 'BLM-20' },
    { name: 'Magneton', number: '21', rarity: 'Rare', supertype: 'Pokémon', types: ['Electric'], hp: 120, artist: 'Toshinobu Saito', setImageId: 1, tcgplayerId: 'BLM-21' },
    { name: 'Dodrio', number: '16', rarity: 'Uncommon', supertype: 'Pokémon', types: ['Normal'], hp: 95, artist: 'Masayaki Kobayashi', setImageId: 1, tcgplayerId: 'BLM-16-2' },
    { name: 'Electabuzz', number: '22', rarity: 'Rare', supertype: 'Pokémon', types: ['Electric'], hp: 115, artist: 'Tomoaki Fukuda', setImageId: 1, tcgplayerId: 'BLM-22' },
    { name: 'Magmar', number: '24', rarity: 'Rare', supertype: 'Pokémon', types: ['Fire'], hp: 115, artist: 'Fujio Obata', setImageId: 1, tcgplayerId: 'BLM-24' },
    { name: 'Tyranitar', number: '27', rarity: 'Rare Holo', supertype: 'Pokémon', types: ['Rock', 'Dark'], hp: 140, artist: 'Mitsuhiro Aida', setImageId: 1, tcgplayerId: 'BLM-27' },
    { name: 'Golbat', number: '42', rarity: 'Uncommon', supertype: 'Pokémon', types: ['Poison', 'Flying'], hp: 95, artist: 'Yoji Shinkawa', setImageId: 1, tcgplayerId: 'BLM-42' },
  ];

  const baseSet = await prisma.set.upsert({
    where: { name: 'Base Set' },
    update: {},
    create: {
      name: 'Base Set',
      series: 'Base',
      releaseDate: new Date('1999-01-11'),
      totalCards: baseSetCards.length,
      symbolImage: 'https://images.pokeco.com/sets/baseset/symbol.png',
    },
  });

  for (const cardData of baseSetCards) {
    await prisma.carta.upsert({
      where: { tcgplayerId: cardData.tcgplayerId },
      update: {},
      create: {
        name: cardData.name,
        setId: baseSet.id,
        number: cardData.number,
        rarity: cardData.rarity,
        supertype: cardData.supertype,
        types: cardData.types,
        hp: cardData.hp,
        artist: cardData.artist,
        image_url: `https://images.pokeco.com/cards/base/${cardData.number.toLowerCase()}.jpg`,
        image_url_small: `https://images.pokeco.com/cards/base/${cardData.number.toLowerCase()}_small.jpg`,
        tcgplayerId: cardData.tcgplayerId,
      },
    });
  }

  const cards = await prisma.carta.findMany({ where: { setId: baseSet.id } });

  for (const card of cards) {
    await prisma.imageReference.create({
      data: {
        card_id: card.id,
        url: card.image_url || `https://images.pokeco.com/cards/base/${card.number?.toLowerCase()}.jpg`,
        thumbnail_url: card.image_url_small,
      },
    });
  }

  console.log(`Seeded ${baseSetCards.length} cards from Base Set`);
  console.log(`Created ${cards.length} ImageReference entries for card matching`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
