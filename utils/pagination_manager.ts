/**
 * ページネーション管理クラス
 * ページ・アイテム数の管理と、ページ遷移の操作を提供する
 * ページ・アイテムのインデックスは0始まりで管理する
 * @example
 * const paginator = new PaginationManager(50, 10); // 総アイテム数50、1ページあたり10アイテム
 * console.log(paginator.totalPages()); // 5
 * console.log(paginator.getPage()); // 0
 * paginator.nextPage();
 * console.log(paginator.getPage()); // 1
 * console.log(paginator.getCurrentItems()); // [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
 */
class PaginationManager {
  private totalItems: number;
  private itemsPerPage: number;
  private currentPage: number;

  /**
   * コンストラクタ
   * @param totalItems 総アイテム数
   * @param itemsPerPage 1ページあたりのアイテム数
   */
  constructor(totalItems: number, itemsPerPage: number) {
    this.totalItems = totalItems;
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 0;
  }

  /**
   * 総ページ数を返す
   * @returns 総ページ数
   */
  totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  /**
   * 現在のページ番号 (0始まり) を取得・設定
   */
  getPage(): number {
    return this.currentPage;
  }

  /**
   * 現在のページ番号 (0始まり) を設定
   * @param page 設定するページ番号
   */
  setPage(page: number) {
    if (page < 0 || page >= this.totalPages()) {
      throw new Error("Invalid page number");
    }
    this.currentPage = page;
  }

  /**
   * 次のページへ進む
   */
  nextPage() {
    if (this.currentPage < this.totalPages() - 1) {
      this.currentPage++;
    }
  }

  /**
   * 前のページに戻る
   */
  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }

  /**
   * 最初のページかどうか取得する
   * @returns 最初のページかどうか
   */
  isFirstPage(): boolean {
    return this.currentPage === 0;
  }

  /**
   * 最後のページかどうか取得する
   * @returns 最後のページかどうか
   */
  isLastPage(): boolean {
    return this.currentPage >= this.totalPages() - 1;
  }

  /**
   * 現在のページに表示するアイテムのインデックス配列を取得する
   * @returns アイテムのインデックス配列
   */
  getCurrentItems(): number[] {
    const start = this.currentPage * this.itemsPerPage;
    const end = Math.min(start + this.itemsPerPage, this.totalItems);
    return Array.from({ length: end - start }, (_, i) => start + i);
  }
}

export { PaginationManager };
