import { startPageContents } from "@/constants/StartPage";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // GFMプラグインをインポート

// 表示したいMarkdownコンテンツ

export default function Home() {
  return (
    // layout.tsxでmain要素が定義されているため、ここではセマンティックな意味でarticleを使用します。
    // flexとitems-centerでコンテンツを中央揃えにし、gapとpaddingで余白を調整します。
    <article className="flex flex-col items-center gap-12 py-16">
      <Image
        src="/images/title.png"
        alt="StockProfit10 タイトルロゴ"
        width={600}
        height={200}
        priority
      />

      {/* proseクラスを適用したコンテナでMarkdownを一度だけレンダリングします */}
      <article className="frommarkdown">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {startPageContents}
        </ReactMarkdown>
      </article>
    </article>
  );
}
