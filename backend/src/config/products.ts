export type Product = { id: string; name: string; category: 'bracelet' | 'card-strap' | 'keychain'; categoryLabel: string; price: number; image: string; description: string };

const groups = [
  { prefix: 'bracelet', count: 14, label: 'Vòng tay', category: 'bracelet' as const, price: 30000, description: 'Một chiếc vòng handmade nhiều hạt xinh, phối theo mood riêng của bạn.' },
  { prefix: 'strap', count: 9, label: 'Dây đeo thẻ', category: 'card-strap' as const, price: 49000, description: 'Dây đeo thẻ nhiều màu để chiếc thẻ đi học, đi làm cũng có cá tính.' },
  { prefix: 'keychain', count: 6, label: 'Móc khóa', category: 'keychain' as const, price: 35000, description: 'Charm nhỏ xíu cho chìa khóa, túi tote hoặc chiếc balo thân yêu.' },
];

export const products: Product[] = groups.flatMap((group) => Array.from({ length: group.count }, (_, index) => ({
  id: `${group.prefix}-${index + 1}`,
  name: `${group.label} #${String(index + 1).padStart(2, '0')}`,
  category: group.category,
  categoryLabel: group.label,
  price: group.price,
  image: `/products/${group.prefix}-${index + 1}.png`,
  description: group.description,
})));
