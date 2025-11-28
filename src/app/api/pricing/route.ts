import { NextResponse } from 'next/server';
import type { PricingTier } from '@/lib/types';

let pricingTiers: PricingTier[] = [
    { value: '30', label: '30 minutes', price: 30 },
    { value: '60', label: '1 hour', price: 50 },
    { value: '120', label: '2 hours', price: 90 },
    { value: '180', label: '3 hours', price: 120 },
];

// GET all pricing tiers
export async function GET() {
  return NextResponse.json(pricingTiers);
}

// POST a new pricing tier
export async function POST(request: Request) {
  try {
    const { label, value, price } = await request.json();
    if (!label || !value || price === undefined) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    const newTier: PricingTier = { label, value: String(value), price: Number(price) };
    pricingTiers.push(newTier);
    return NextResponse.json(newTier, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT (update) a pricing tier
export async function PUT(request: Request) {
    try {
      const { originalValue, updatedTier } = await request.json();
      if (!originalValue || !updatedTier) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
      }
  
      const tierIndex = pricingTiers.findIndex(p => p.value === originalValue);
      if (tierIndex === -1) {
        return NextResponse.json({ message: 'Pricing tier not found' }, { status: 404 });
      }
  
      // Ensure types are correct
      const newTier: PricingTier = {
        label: String(updatedTier.label),
        value: String(updatedTier.value),
        price: Number(updatedTier.price),
      };

      pricingTiers[tierIndex] = newTier;
      
      // Also update any PCs that were using the old duration value
      // Note: In a real app, this logic might be more complex or handled differently.
      // For this simulation, this is a placeholder for where that logic would go.

      return NextResponse.json(newTier);
    } catch (error) {
      console.error('API PUT Error:', error);
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
  

// DELETE a pricing tier
export async function DELETE(request: Request) {
    try {
        const { value } = await request.json();
        if (!value) {
            return NextResponse.json({ message: 'Missing value field' }, { status: 400 });
        }
    
        const initialLength = pricingTiers.length;
        pricingTiers = pricingTiers.filter(p => p.value !== value);
    
        if (pricingTiers.length === initialLength) {
            return NextResponse.json({ message: 'Pricing tier not found' }, { status: 404 });
        }
    
        return NextResponse.json({ message: `Pricing tier with value ${value} deleted successfully` });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';
