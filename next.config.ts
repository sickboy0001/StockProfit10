import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "finance.yahoo.co.jp", // Yahoo!ファイナンスの画像ドメインを追加
      // 他の既存のドメインがある場合はここに追加
    ],
  },
};

export default nextConfig;
