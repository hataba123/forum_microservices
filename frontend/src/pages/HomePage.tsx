// src/pages/HomePage.tsx
import ForumBlock from "../components/ForumBlocK";
export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 rounded-xs md:grid-cols-4 gap-6">
        {/* Main content - 75% */}
        <div className="md:col-span-3 space-y-6">
          {forumData.map((section, index) => (
            <ForumBlock
              key={index}
              category={section.category}
              forums={section.forums}
            />
          ))}
        </div>

        {/* Sidebar - 25% */}
        <aside className="md:col-span-1 space-y-4">
          <div className="bg-gray-100 p-4 rounded-xs shadow">
            <h3 className="font-bold mb-2 text-blue-600">Thông tin</h3>
            <p className="text-sm text-gray-600">
              Chào mừng bạn đến với forum clone VOZ.
            </p>
          </div>

          <div className="bg-gray-100 p-4 rounded-xl shadow">
            <h3 className="font-bold mb-2 text-blue-600">Top Chủ đề</h3>
            <ul className="text-sm list-disc list-inside text-gray-700">
              <li>Game hot 2025</li>
              <li>iOS 19 Review</li>
              <li>Drama công nghệ</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
// src/data/forumData.ts
const forumData = [
  {
    category: "General",
    forums: [
      {
        title: "Thông báo từ BQT",
        threads: 125,
        posts: 2500,
        lastPost: "Admin - 1h trước",
      },
      { title: "Góp ý", threads: 230, posts: 1350, lastPost: "Mod - 2h trước" },
    ],
  },
  {
    category: "Mobile & IT",
    forums: [
      {
        title: "Điện thoại",
        threads: 850,
        posts: 10000,
        lastPost: "user123 - 5p trước",
      },
      {
        title: "Android",
        threads: 560,
        posts: 6700,
        lastPost: "devvn - 10p trước",
      },
      {
        title: "iOS",
        threads: 430,
        posts: 5200,
        lastPost: "applefan - 20p trước",
      },
    ],
  },
  {
    category: "Game & Giải trí",
    forums: [
      {
        title: "Game PC",
        threads: 900,
        posts: 12000,
        lastPost: "gamer01 - 3p trước",
      },
      {
        title: "Console",
        threads: 300,
        posts: 4100,
        lastPost: "pslover - 1h trước",
      },
      {
        title: "Phim ảnh",
        threads: 250,
        posts: 3300,
        lastPost: "cinepro - 30p trước",
      },
    ],
  },
];
