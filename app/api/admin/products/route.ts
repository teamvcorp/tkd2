import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { getProducts, addProduct } from '@/lib/shop';
import type { ShopProduct } from '@/lib/shop';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const products = await getProducts();
  // Normalise quantity to null when not set so admin UI shows a blank field
  const withQuantity = products.map((p) => ({ ...p, quantity: p.quantity ?? null }));
  return NextResponse.json({ products: withQuantity });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as Omit<ShopProduct, 'id'>;
  const product: ShopProduct = {
    ...body,
    id: crypto.randomUUID(),
    imageSrc: body.imageSrc || '',
    imageAlt: body.imageAlt || body.name,
  };
  await addProduct(product);
  return NextResponse.json({ product }, { status: 201 });
}
