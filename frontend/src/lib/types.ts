export type MenuItem = {
  id: number; name: string; description: string; price: string; image_url?: string;
  category: string;
};
export type Cart = { id: number; items: CartItem[] };
export type CartItem = { id:number; menu_item: MenuItem; quantity:number; selected_options: any[] };
