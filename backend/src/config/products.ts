export type Product = { id: string; name: string; category: 'bracelet' | 'card-strap' | 'keychain'; categoryLabel: string; price: number; image: string; description: string };

// Names and taglines are the ones printed on the shop's own product photos; keep them in sync with frontend/src/LandingPage.jsx.
const groups = [
  { prefix: 'bracelet', label: 'Vòng tay', category: 'bracelet' as const, price: 30000, items: [
    ['Sao Xinh Xắn', 'Đại diện sự tự tin và tỏa sáng, hãy cứ là phiên bản nổi bật nhất chính mình.'],
    ['Xanh Lấp Blink', 'Sắc xanh của tự do, bình yên, thêm chút lấp lánh cho cá tính riêng.'],
    ['Red Chói Chói', 'Sắc đỏ mạnh mẽ, quyết đoán và không ngại khác biệt.'],
    ['Tím Mọng Mer', 'Một chút mộng mơ, một chút bí ẩn cho những tâm hồn có thế giới riêng.'],
    ['Hồng Hây Hey', 'Nguồn năng lượng hồng hào rực rỡ cho những nàng yêu bản thân và sống theo cảm xúc.'],
    ['Nắng Ưiii', 'Mang một chút nắng bên người, để ngày nào cũng có lý do để vui.'],
    ['Kẹo Bông Hằm', 'Ngọt ngào, đáng yêu nhưng không nhạt nhòa.'],
  ] },
  { prefix: 'strap', label: 'Dây đeo thẻ', category: 'card-strap' as const, price: 49000, items: [
    ['Xương Danh', 'Dây đeo thẻ sinh viên handmade.'],
    ['Xa Lánh', 'Dây đeo thẻ sinh viên handmade.'],
    ['Đỏ Đo', 'Dây đeo thẻ sinh viên handmade.'],
    ['Hèo Bông', 'Dây đeo thẻ sinh viên handmade.'],
  ] },
  { prefix: 'keychain', label: 'Móc khóa', category: 'keychain' as const, price: 35000, items: [
    ['Bông Xa Lánh', 'Móc khóa handmade.'],
    ['Bông Vàng Khè', 'Móc khóa handmade.'],
    ['Bông Hồng Lầy', 'Móc khóa handmade.'],
    ['Bông Dưới Biển', 'Móc khóa handmade.'],
    ['Bông Ngành Y', 'Móc khóa handmade.'],
  ] },
];

export const products: Product[] = groups.flatMap((group) => group.items.map(([name, description], index) => ({
  id: `${group.prefix}-${index + 1}`,
  name,
  category: group.category,
  categoryLabel: group.label,
  price: group.price,
  image: `/products/${group.prefix}-${index + 1}.png`,
  description,
})));
