import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { getProductById, updateProduct, deleteProduct } from '@/lib/shop';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!(await getProductById(id))) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }

  const body = (await request.json()) as Partial<{
    inStock: boolean;
    quantity: number;
    stripeProductId: string;
    stripePriceId: string;
  }>;
  await updateProduct(id, body);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  await deleteProduct(id);
  return NextResponse.json({ success: true });
}
