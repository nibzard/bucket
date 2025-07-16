"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Bucket
            </Link>
            <nav className="flex space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Files
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {status === "loading" ? (
              <div className="text-gray-500">Loading...</div>
            ) : session ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, {session.user?.name || "Admin"}</span>
                <button
                  onClick={() => signOut()}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}