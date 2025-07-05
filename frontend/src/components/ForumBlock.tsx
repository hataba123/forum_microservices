// src/components/ForumBlock.tsx
import React from "react";

interface Forum {
  title: string;
  threads: number;
  posts: number;
  lastPost: string;
}

interface Props {
  category: string;
  forums: Forum[];
}

const ForumBlock: React.FC<Props> = ({ category, forums }) => {
  return (
    <div className="mb-6  rounded-xs shadow bg-gray-100">
      <h2 className="text-lg font-bold bg-white px-4 py-2 rounded-t-xl text-blue-700">
        {category}
      </h2>
      <table className="w-full text-sm">
        <thead className="bg-white text-gray-600">
          <tr>
            <th className="text-left px-4 py-2">Diễn đàn</th>
            <th className="px-4 py-2">Chủ đề</th>
            <th className="px-4 py-2">Bài viết</th>
            <th className="text-left px-4 py-2">Bài mới nhất</th>
          </tr>
        </thead>
        <tbody>
          {forums.map((forum, index) => (
            <tr key={index} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2 font-medium text-blue-600">
                {forum.title}
              </td>
              <td className="text-center">{forum.threads}</td>
              <td className="text-center">{forum.posts}</td>
              <td className="px-4 py-2 text-sm text-gray-500">
                {forum.lastPost}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ForumBlock;
