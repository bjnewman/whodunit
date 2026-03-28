import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-5xl font-bold tracking-tight">Whodunit</h1>
      <p className="text-xl text-gray-400 max-w-md text-center">
        Turn any detective novel into a playable mystery game.
      </p>
      <Link
        href="/extract"
        className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition"
      >
        Upload a Book →
      </Link>
    </main>
  );
}
