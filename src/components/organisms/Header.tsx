"use client"; // NavigationMenuはクライアントコンポーネントである必要があるため

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { headerNavItems, NavItem } from "@/constants/menu";
import { LoginDialog } from "./LoginDialog"; //  作成した LoginDialog をインポート
// import { signOut } from "@/app/actions/auth"; //  ログアウトアクションをインポート
import { useState } from "react";
import { useRouter } from "next/navigation";
// import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"; // これをインポート
// import { Database } from "@/types/supabase"; //  Database 型をインポート
import { LoginSuccessAlert } from "@/components/molecules/LoginSuccessAlert"; // パスを修正 (必要であれば)
import { LogoutSuccessAlert } from "../molecules/LogoutSuccessAlert";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronDown, LogIn, LogOut } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { signOut } from "@/app/actions/auth";
import { SigninDialog } from "./SigninDialog";
import {
  fetchAllRolesAddAdminAction,
  getUserByEmailAddRoleAdmin,
  Role,
  UserWithRoles,
} from "@/app/actions/UserRole";

export function Header() {
  const { user, loading } = useAuth(); // ★ Context からユーザー情報とローディング状態を取得
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isSigninDialogOpen, setIsSigninDialogOpen] = useState(false); // ★ SigninDialog用のstate
  const [userDetail, setUserDetail] = useState<UserWithRoles | null>(null); // 型を明示
  const [roles, setRoles] = useState<Role[] | null>(null);

  // const { userName, setUserName } = useState("");

  // headerNavItems の型を仮定 (実際の型に合わせて調整してください)

  const router = useRouter(); // ★ router インスタンスを取得

  const username = user ? user.user_metadata?.name || "Guest" : "Guest";

  React.useEffect(() => {
    if (user !== undefined) {
      //getUserByEmailを利用して、userDetailを入手
      setIsLoginDialogOpen(false);
    }
    const fetchUserDetail = async () => {
      if (user && user.email) {
        try {
          console.log("header.tsx user", user);
          const detail = await getUserByEmailAddRoleAdmin(user); // 新しいアクションを呼び出し

          setUserDetail(detail);
          // console.log("Fetched userDetail:", detail);
        } catch (error) {
          console.error("Error fetching userDetail:", error);
          setUserDetail(null); // エラー時はnullに設定
        }
      } else {
        setUserDetail(null); // ユーザー情報がない場合はnullに設定
      }
    };
    const fetchAllRoles = async () => {
      try {
        const { data: rolesData, error: rolesError } =
          await fetchAllRolesAddAdminAction();
        if (rolesError) {
          throw new Error(rolesError);
        }
        setRoles(rolesData || []);
        // console.log("Fetched all roles:", rolesData);
      } catch (error) {
        console.error("Error fetching all roles:", error);
        setRoles([]); // エラー時は空配列に設定
      }
    };
    fetchUserDetail();
    fetchAllRoles(); // 全てのロール情報を取得
  }, [user]); // user の変化を監視

  const handleOpenSigninDialog = () => {
    setIsLoginDialogOpen(false); // ログインダイアログを閉じる
    setIsSigninDialogOpen(true); // サインインダイアログを開く
  };

  const handleOpenLoginDialog = () => {
    setIsSigninDialogOpen(false); // サインインダイアログを閉じる
    setIsLoginDialogOpen(true); // ログインダイアログを開く
  };
  //  ログアウト処理
  const handleSignOut = async () => {
    await signOut();
    // setUser(null); //  サインアウト成功時に手動でユーザー状態をクリア
    router.push("/");
    //  sessionStorage にログアウト成功フラグを立てる
    sessionStorage.setItem("showLogoutSuccessMessage", "true");
    window.location.reload(); //  ページ全体をリロードしてみる
  };

  // ナビゲーションアイテム表示制御ヘルパー関数
  const canViewMenuItem = (
    item: NavItem,
    currentUserDetail: UserWithRoles | null,
    allAppRoles: Role[] | null // アプリケーション全体の役割リスト
  ): boolean => {
    // 1. メニューアイテムに役割要件がない場合は、常に表示
    if (!item.roles || item.roles.length === 0) {
      return true;
    }

    // 2. メニューアイテムに役割要件がある場合：
    //    ユーザー詳細が存在し、ユーザーに役割が割り当てられているか確認
    if (
      !currentUserDetail ||
      !currentUserDetail.user_roles ||
      currentUserDetail.user_roles.length === 0 ||
      !allAppRoles ||
      allAppRoles.length === 0
    ) {
      return false; // 役割要件のあるアイテムは表示しない
    }
    // 3. ユーザーの役割とアイテムの役割要件を比較
    // 3. item.roles の短縮名を正式名に変換し、ユーザーの役割と比較
    return item.roles.some((requiredShortName) => {
      // item.roles に含まれる短縮名 (requiredShortName) に対応する正式名を探す
      const roleDetails = allAppRoles.find(
        (appRole) => appRole.short_name === requiredShortName
      );
      if (roleDetails && roleDetails.name) {
        // 正式名が見つかれば、ユーザーがその役割を持っているか確認
        return currentUserDetail.user_roles.includes(roleDetails.name);
      }
      return false; // 短縮名に対応する役割が見つからない場合は非表示
    });
  };

  return (
    <>
      <header className="text-gray-600 body-font">
        <div className="container mx-auto flex flex-wrap p-1 flex-col md:flex-row items-center">
          <Link href="/" className="font-bold text-base sm:text-2xl">
            <div>
              <Image
                src="/images/title-small.png"
                alt="LogImage" // より具体的なaltテキストを推奨
                width={150} // 数値で指定
                height={40} // 数値で指定
                priority // ヘッダーのロゴはLCPの候補になるため、priorityを付与
              />
            </div>
          </Link>
          <nav className="md:mr-auto md:ml-4 md:py-1 md:pl-4 md:border-l md:border-gray-400	flex flex-wrap items-center text-base justify-center">
            <NavigationMenu>
              <NavigationMenuList>
                {headerNavItems
                  .filter((item) => canViewMenuItem(item, userDetail, roles))
                  .map((item) => (
                    <NavigationMenuItem key={item.id}>
                      {item.type === "link" && (
                        <NavigationMenuLink
                          asChild
                          className={navigationMenuTriggerStyle()}
                        >
                          <Link href={item.href}>{item.label}</Link>
                        </NavigationMenuLink>
                      )}
                      {item.type === "dropdown" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className={cn(
                                navigationMenuTriggerStyle(),
                                "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
                              )}
                            >
                              {item.label}
                              <ChevronDown className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-[200px]"
                          >
                            {item.items?.map(
                              (
                                subItem // item.items が存在する場合のみ map
                              ) => (
                                <DropdownMenuItem key={subItem.id} asChild>
                                  <Link href={subItem.href}>
                                    {subItem.label}
                                  </Link>
                                </DropdownMenuItem>
                              )
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </NavigationMenuItem>
                  ))}
              </NavigationMenuList>
            </NavigationMenu>
          </nav>
          <div className="flex items-center space-x-4">
            {/* ログイン・ログアウトUIなど */}
            {loading ? (
              <>
                <div className="h-9 w-90 animate-pulse rounded-md bg-muted flex items-center justify-end">
                  読み取り中・・・
                  <Button variant="outline" onClick={handleSignOut}>
                    LogOut
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">ログアウト</span>
                  </Button>
                </div>
              </>
            ) : user ? (
              <>
                <span className="hidden sm:inline-block text-sm text-muted-foreground truncate max-w-[90px]">
                  {username}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleSignOut}>
                      LogOut
                      <LogOut className="h-5 w-5" />
                      <span className="sr-only">ログアウト</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>ログアウト</p>
                  </TooltipContent>
                </Tooltip>
              </>
            ) : (
              <>
                <span className="hidden sm:inline-block text-sm font-bold text-blue-600 truncate max-w-[90px]">
                  Guest
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => setIsLoginDialogOpen(true)}
                    >
                      Login
                      <LogIn className="h-5 w-5" />
                      <span className="sr-only">ログイン</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>ログイン</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </header>
      <LogoutSuccessAlert />
      <LoginSuccessAlert />
      <LoginDialog
        open={isLoginDialogOpen}
        onOpenChange={setIsLoginDialogOpen}
        onSwitchToSignin={handleOpenSigninDialog} // ★ propsを渡す
      />
      <SigninDialog
        open={isSigninDialogOpen}
        onOpenChange={setIsSigninDialogOpen}
        onSwitchToLogin={handleOpenLoginDialog} // ★ propsを渡す
        // 必要であれば、サインインからログインへ戻るための onSwitchToLogin も実装
      />
    </>
  );
}
