// c:\work\dev\spa\hadbit-app\src\components\organisms\Header_dummy.ts

// メニュー項目の型定義
interface NavItemBase {
  id: string; // keyとして使用するための一意なID
  label: string;
  roles?: string[];
}

interface NavLinkItem extends NavItemBase {
  type: "link";
  href: string;
}

interface NavDropdownItem extends NavItemBase {
  type: "dropdown";
  items: Array<{ id: string; href: string; label: string; roles?: string[] }>;
}

export type NavItem = NavLinkItem | NavDropdownItem;

// メニューデータ
export const headerNavItems: NavItem[] = [
  // { id: "Done", type: "link", label: "done", href: "/habit/done" },

  {
    id: "StockHistroyViewManger",
    type: "link",
    label: "StockHistory",
    roles: ["ADMIN", "MAN", "MEN", "DEB"],
    href: "/Manager/HistoryManager",
  },
  {
    id: "ChatTest",
    type: "link",
    label: "ChatTest",
    href: "/stock/ChartTest",
  },
  {
    id: "Portfolio",
    type: "link",
    label: "Portfolio",
    href: "/Portfolio/List",
  },
  {
    id: "Compass",
    type: "link",
    label: "Compass",
    href: "/Compass/Condition/List",
  },
  //http://192.168.2.100:3000/Execute/Maintenance
  {
    id: "Executes",
    type: "link",
    label: "Executes",
    href: "/Execute/Maintenance",
  },
  {
    id: "menu",
    type: "dropdown",
    label: "メニュー",
    items: [
      {
        id: "apiTest",
        label: "apiTest",
        href: "/stock/ApiDataViewer",
      },
      {
        id: "contact",
        label: "contact",
        roles: ["ADMIN", "MAN", "MEN", "DEB"],
        href: "/Contact",
      },
      {
        id: "ImportJsx",
        label: "ImportJsx",
        roles: ["ADMIN", "MAN", "MEN", "DEB"],
        href: "/stock/MasterImportJsx",
      },
      {
        id: "MarketCalendar",
        label: "MarketCalendar",
        roles: ["ADMIN", "MAN", "MEN", "DEB"],
        href: "/MarketCalendar",
      },
      {
        id: "userProfile",
        label: "profile",
        href: "/user/profile",
      },
      {
        id: "AdminUserList",
        label: "UserList",
        roles: ["ADMIN", "MAN", "MEN", "DEB"],
        href: "/Manager/UserList",
      },
      {
        id: "ConvetSptStock",
        label: "ConvertSptStock",
        roles: ["ADMIN", "MAN", "MEN", "DEB"],
        href: "/stock/ConvertToStocks",
      },
    ],
  },
];
