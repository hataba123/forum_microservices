export default function Footer() {
  return (
    <footer className="bg-blue-600 text-white text-center py-4">
      <p className="text-sm">
        © {new Date().getFullYear()} VOZ Clone. All rights reserved.
      </p>
    </footer>
  );
}
