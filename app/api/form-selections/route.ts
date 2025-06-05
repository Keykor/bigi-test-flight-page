import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Ensure we have data and an iterationId
    if (!data || !data.iterationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Add server timestamp to the data
    const formSelectionData = {
      ...data,
      serverTimestamp: serverTimestamp(),
    };
    
    // Store in a separate collection
    const docRef = await addDoc(
      collection(db, 'formSelections'),
      formSelectionData
    );
    
    return NextResponse.json({ id: docRef.id, success: true });
  } catch (error) {
    console.error('Error saving form selection:', error);
    return NextResponse.json(
      { error: 'Failed to save form selection' },
      { status: 500 }
    );
  }
}
