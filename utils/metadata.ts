/**
 * Next.jsのメタデータを生成するユーティリティ関数
 */
import type { Metadata } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

type MetaConfig = Readonly<{
  url: string;
  title: string;
  description: string;
  twitterHandle?: string;
  locale: string;
  ogp: string;
  favicon: string;
  creator: string;
  keywords?: string[];
}>;

// ページで上書き可能なメタデータのプロパティ
type PageMetaConfig = Pick<MetaConfig, "description" | "ogp">;

/**
 * ページ固有のメタデータを生成する
 *
 * @example
 * // 基本的な使用
 * export const metadata = createMetadata(METADATA);
 *
 * @example
 * // ページ固有のカスタマイズ
 * export const metadata = createMetadata(META_DATA, {
 *   description: "あなたの性格を診断します",
 *   ogp: "/attraction/mbti-ogp.png"
 * });
 *
 * @param metadata メタデータ設定
 * @param overrides ページ固有で上書きしたいメタデータ
 * @returns Next.js用のメタデータオブジェクト
 */
function createMetadata(
  metadata: MetaConfig,
  overrides?: Partial<PageMetaConfig>,
): Metadata {
  const mergedMetadata = { ...metadata, ...overrides };
  // Next.js用のメタデータ設定
  const nextMetadata: Metadata = {
    metadataBase: new URL(mergedMetadata.url),
    title: isDevelopment
      ? `[DEV] ${mergedMetadata.title}`
      : mergedMetadata.title,
    description: mergedMetadata.description,
    keywords: mergedMetadata.keywords,
    openGraph: {
      type: "website",
      locale: mergedMetadata.locale,
      url: mergedMetadata.url,
      title: mergedMetadata.title,
      description: mergedMetadata.description,
      siteName: mergedMetadata.title,
      images: [
        {
          url: mergedMetadata.ogp,
          width: 1200,
          height: 630,
          alt: mergedMetadata.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: mergedMetadata.title,
      description: mergedMetadata.description,
      creator: mergedMetadata.twitterHandle,
      images: [mergedMetadata.ogp],
    },
    robots: {
      index: !isDevelopment, // 開発環境ではインデックスしない
      follow: !isDevelopment,
      googleBot: {
        index: !isDevelopment,
        follow: !isDevelopment,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: mergedMetadata.favicon,
    },
  };
  return nextMetadata;
}

export { type MetaConfig, type PageMetaConfig, createMetadata };
