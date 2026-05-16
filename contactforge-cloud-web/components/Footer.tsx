export default function Footer() {
  return (
    <footer className="w-full px-6 py-12 mt-12 border-t border-slate-900 bg-slate-950 text-center">
      <p className="text-slate-500 text-sm">
        Crafted with purpose by <span className="text-slate-300 font-medium">Shivansh Mishra</span>.
      </p>
      <p className="text-slate-600 text-xs mt-2">
        © {new Date().getFullYear()} ContactForge. Privacy by design.
      </p>
    </footer>
  );
}
