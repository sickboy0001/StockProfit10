// c:\work\dev\spa\hadbit-app\src\components\organisms\Header_dummy.ts

// メニュー項目の型定義
interface NavItemBase {
  id: string; // keyとして使用するための一意なID
  label: string;
}

interface NavLinkItem extends NavItemBase {
  type: "link";
  href: string;
}

interface NavDropdownItem extends NavItemBase {
  type: "dropdown";
  items: Array<{ id: string; href: string; label: string }>;
}

export type NavItem = NavLinkItem | NavDropdownItem;

// メニューデータ
export const headerNavItems: NavItem[] = [
  // { id: "Done", type: "link", label: "done", href: "/habit/done" },
  {
    id: "apiTest",
    type: "link",
    label: "apiTest",
    href: "/stock/ApiDataViewer",
  },
  {
    id: "ImportJsx",
    type: "link",
    label: "ImportJsx",
    href: "/stock/MasterImportJsx",
  },
  {
    id: "StockHistroyViewManger",
    type: "link",
    label: "StockHistory",
    href: "/Manager/HistoryManager",
  },
  {
    id: "ConvetSptStock",
    type: "link",
    label: "ConvertSptStock",
    href: "/stock/ConvertToStocks",
  },
  {
    id: "ChatTest",
    type: "link",
    label: "ChatTest",
    href: "/stock/ChartTest",
  },

  {
    id: "menu",
    type: "dropdown",
    label: "メニュー",
    items: [
      { id: "Mantenance", label: "mantenance", href: "/habit/manager" },
      { id: "jsxconvert", label: "import", href: "/convert/jsx" },
      { id: "userProfile", label: "profile", href: "/user/profile" },
      {
        id: "AdminUserList",
        label: "UserList",
        href: "/Manager/UserList",
      },
      // { id: "docs", href: "/docs", label: "ドキュメント" },
      // { id: "settings", href: "/settings", label: "設定" },
      // { id: "profile", href: "/profile", label: "プロフィール" },
    ],
  },
];
