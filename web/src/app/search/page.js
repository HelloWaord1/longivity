'use client';

// Redirect to home page which has the search
import { redirect } from 'next/navigation';

export default function SearchPage() {
  redirect('/');
}
