// components/Pagination.tsx
import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // const pageNumbers = [];
  // 表示するページ番号の範囲を調整
  // const maxPageButtons = 5; // 表示する最大ページボタン数
  // let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
  // let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

  // if (endPage - startPage + 1 < maxPageButtons) {
  //   startPage = Math.max(1, endPage - maxPageButtons + 1);
  // }

  // for (let i = startPage; i <= endPage; i++) {
  //   pageNumbers.push(i);
  // }

  return (
    <nav className="flex justify-center mt-6" aria-label="Pagination">
      <ul className="inline-flex -space-x-px text-sm">
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center justify-center px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            前へ
          </button>
        </li>
        {/* {pageNumbers.map((number) => (
          <li key={number}>
            <button
              onClick={() => onPageChange(number)}
              className={`flex items-center justify-center px-3 h-8 leading-tight ${
                currentPage === number
                  ? "text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700"
                  : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              {number}
            </button>
          </li>
        ))} */}
        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            次へ
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;
